import { ChangeEvent, FormEvent, useState } from "react";
import { postEmail } from "../utils/hooks";

const EmailCaptureComponent = () => {
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  // submits email
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    postEmail(email);
    // reset input
    setEmail('');
    setSubmitted(true);
    event.preventDefault();
  }

  // updates state with email after any change
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
    event.preventDefault();
  }

  return (
    <div id="emailCaptureContainer">
      <h2>🎉 Drop your email for surprises</h2>
      <form className="w-full max-w-sm justify-center items-center" onSubmit={handleSubmit}>
        <div className="flex items-center border-b border-teal-500 py-2 justify-center">
          <input
            className="text-white appearance-none bg-transparent border-none w-full text-white-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="email"
            value={email}
            onChange={handleChange}
            placeholder="Your email"
          />
          <button
            className="bg-gray-900 w-52 h-11 hover:bg-black text-white button_nav" disabled={submitted}>
            Sign up
          </button>
          {/* <button
            className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded"
            type="button"
          >
            Sign Up
          </button> */}
        </div>
      </form>
    </div>
  );
};

export default EmailCaptureComponent;
