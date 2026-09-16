type Reveal = { active: number; dissolve: number; grayscale: number; edge: number; brightness: number };
type Rgb = [number, number, number];
export type FilmDraw = { film: [number, number]; crop: { x: number; y: number; w: number; h: number }; center: [number, number]; reveal: Reveal; paper: Rgb; ink: Rgb };

const VERTEX = `attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;

// Outside the reveal the frame is drawn plainly. Inside it, colour drains into the page's paper tone while
// Sobel edges draw the iris in ink, and a noisy threshold burns the paper away from the centre with a charcoal edge.
// Weak gradients and near-black pixels are excluded from the edge pass so codec block noise is not etched.
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTexture;
uniform vec2 uFilm,uCropOrigin,uCropSize,uTexel,uCenter;
uniform vec3 uPaper,uInk;
uniform float uReach,uActive,uDissolve,uGrayscale,uEdge,uBrightness;
varying vec2 vUv;
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.;a*=.5;}return v;}
float sobel(vec2 uv){float gx=0.,gy=0.;for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){float l=luma(texture2D(uTexture,uv+vec2(float(i),float(j))*uTexel).rgb);float fi=float(i),fj=float(j);gx+=l*fi*(2.-abs(fj));gy+=l*fj*(2.-abs(fi));}}return sqrt(gx*gx+gy*gy);}
void main(){
 vec2 p=vec2(vUv.x,1.-vUv.y)*uFilm;
 vec2 uv=clamp((p-uCropOrigin)/uCropSize,0.,1.);
 vec4 tex=texture2D(uTexture,uv);
 if(uActive<.5){gl_FragColor=vec4(tex.rgb,1.);return;}
 vec2 d=p-uCenter;
 float dist=length(d)/uReach;
 float angle=atan(d.y,d.x);
 vec2 block=floor(p/6.)*6./uFilm;
 float nd=dist+fbm(block*100.)*.12+fbm(vec2(angle*5.,0.))*.15;
 float threshold=uDissolve*1.35;
 float mask=smoothstep(threshold-.03,threshold,nd);
 float edge=smoothstep(.045,.27,sobel(uv))*smoothstep(.02,.10,luma(tex.rgb));
 vec3 grey=mix(tex.rgb,vec3(luma(tex.rgb)),uGrayscale);
 vec3 base=mix(grey,uPaper,uGrayscale);
 float lines=clamp(edge*uEdge*2.*(1.+uGrayscale*3.)*uBrightness,0.,1.);
 vec3 color=mix(base,uInk,lines*.95);
 float zoneW=.15*(1.-uDissolve)+.02;
 float zone=smoothstep(threshold-zoneW,threshold-zoneW+.04,nd)*(1.-smoothstep(threshold-.02,threshold+.02,nd))*min(1.,uDissolve*20.);
 float ember=clamp(hash(floor(p/4.))*zone*3.*(1.-uDissolve)*uBrightness*(1.+uGrayscale*2.),0.,1.);
 color=mix(color,uInk,ember*.7);
 gl_FragColor=vec4(color*mask,mask);
}`;

const UNIFORMS = ['uTexture', 'uFilm', 'uCropOrigin', 'uCropSize', 'uTexel', 'uCenter', 'uPaper', 'uInk', 'uReach', 'uActive', 'uDissolve', 'uGrayscale', 'uEdge', 'uBrightness'] as const;

export class FilmRenderer {
  static create(canvas: HTMLCanvasElement): FilmRenderer | null {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) return null;
    try { return new FilmRenderer(canvas, gl); } catch { return null; }
  }
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private location = new Map<string, WebGLUniformLocation | null>();
  private uploaded = -1;
  private texel: [number, number] = [1 / 1280, 1 / 720];
  private lost = false;
  private constructor(private canvas: HTMLCanvasElement, private gl: WebGLRenderingContext) {
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); this.lost = true; this.program = null; });
    canvas.addEventListener('webglcontextrestored', () => { this.lost = false; try { this.setup(); } catch { this.lost = true; } });
    // A remount can inherit a context its previous owner lost; ask for it back and build once restored.
    if (gl.isContextLost()) { this.lost = true; gl.getExtension('WEBGL_lose_context')?.restoreContext(); }
    else this.setup();
  }
  private setup() {
    const { gl } = this;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'shader');
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'program');
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    for (const name of UNIFORMS) this.location.set(name, gl.getUniformLocation(program, name));
    gl.uniform1i(this.location.get('uTexture')!, 0);
    gl.clearColor(0, 0, 0, 0);
    this.program = program;
    this.uploaded = -1;
  }
  draw(index: number, image: TexImageSource, d: FilmDraw): boolean {
    if (this.lost || !this.program) return false;
    const { gl } = this;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    if (this.uploaded !== index) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      const size = image as { width: number; height: number };
      this.texel = [1 / size.width, 1 / size.height];
      this.uploaded = index;
    }
    const u = (name: string) => this.location.get(name)!;
    const [w, h] = d.film, [cx, cy] = d.center;
    gl.uniform2f(u('uFilm'), w, h);
    gl.uniform2f(u('uCropOrigin'), d.crop.x, d.crop.y);
    gl.uniform2f(u('uCropSize'), d.crop.w, d.crop.h);
    gl.uniform2f(u('uTexel'), this.texel[0], this.texel[1]);
    gl.uniform2f(u('uCenter'), cx, cy);
    gl.uniform3f(u('uPaper'), d.paper[0], d.paper[1], d.paper[2]);
    gl.uniform3f(u('uInk'), d.ink[0], d.ink[1], d.ink[2]);
    gl.uniform1f(u('uReach'), Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)));
    gl.uniform1f(u('uActive'), d.reveal.active);
    gl.uniform1f(u('uDissolve'), d.reveal.dissolve);
    gl.uniform1f(u('uGrayscale'), d.reveal.grayscale);
    gl.uniform1f(u('uEdge'), d.reveal.edge);
    gl.uniform1f(u('uBrightness'), d.reveal.brightness);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  }
  // Release GPU resources but keep the context: a canvas can hold only one context kind, and a remount reuses it.
  destroy() {
    const { gl } = this;
    if (this.program) gl.deleteProgram(this.program);
    if (this.texture) gl.deleteTexture(this.texture);
    this.program = null; this.texture = null;
  }
}
