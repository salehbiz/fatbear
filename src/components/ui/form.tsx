import type { ComponentProps } from 'react';
import './form.css';

// Native-control adaptation of the supplied Base UI form, for this CSS project.
export function Form({ className = '', ...props }: ComponentProps<'form'>) {
 return <form data-slot="form" className={`membership-form ${className}`} {...props}/>;
}
export function Input(props: ComponentProps<'input'>) {
 return <span data-slot="input-control" className="membership-input"><input data-slot="input" {...props}/></span>;
}
export function SubmitButton({ loading = false, disabled, children, ...props }: ComponentProps<'button'> & { loading?: boolean }) {
 return <button className="membership-submit" disabled={loading || disabled} {...props}>
  <span style={{visibility:loading?'hidden':undefined}}>{children}</span>
  {loading&&<span className="membership-spinner" role="status" aria-label="Sending application"/>}
 </button>;
}
