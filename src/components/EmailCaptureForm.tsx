const EmailCaptureComponent = () => {
  return (
    <div id="emailCaptureContainer">
      <h2>🎉 Drop your email for surprises</h2>
      <form className="w-full max-w-sm justify-center items-center">
        <div className="flex items-center border-b border-teal-500 py-2 justify-center">
          <input
            className="text-white appearance-none bg-transparent border-none w-full text-white-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            type="email"
            placeholder="Email"
          />
          <button
            className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded"
            type="button"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailCaptureComponent;
