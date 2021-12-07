import { ChangeEvent, FormEvent, useState } from "react";
import { postEmail } from "../utils/hooks";

const EmailCaptureComponent = () => {
  const [email, setEmail] = useState<string>('');

  // submits email
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    postEmail(email);
    // reset input
    setEmail('');
    event.preventDefault();
  }

  // updates state with email after any change
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
    event.preventDefault();
  }

  return (
    <div id="emailCaptureContainer" className="items-center justify-center">
      <h2>🎉 Drop your email for surprises</h2>
      <form className="w-full max-w-xxs md:min-w-full justify-center" onSubmit={handleSubmit}>
        <div className="flex items-center border-b border-teal-500 py-2 justify-center">
          <input
            className="text-white appearance-none bg-transparent border-none w-full text-white-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="email"
            value={email}
            onChange={handleChange}
            placeholder="Your email"
          />
          <button
            className="bg-gray-900 w-52 h-11 hover:bg-black text-white button_nav" >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailCaptureComponent;
