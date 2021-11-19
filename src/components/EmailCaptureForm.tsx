const EmailCaptureComponent = () => {
  return (
    <div id="emailCaptureContainer">
      <h2>🎉 Drop your email for surprises</h2>
      <form className="emailCaptureForm">
        <script src="https://static.airtable.com/js/embed/embed_snippet_v1.js"></script>
        <iframe title = "airtable" className="airtable-embed airtable-dynamic-height" 
        src="https://airtable.com/embed/shreCiDTt7rOLSUdz?backgroundColor=greenLight" 
        frameBorder="0" width="100%" height="470" 
        style={{background: "transparent", border: "1px"}}></iframe>
      </form>
    </div>
  );
};

export default EmailCaptureComponent;
