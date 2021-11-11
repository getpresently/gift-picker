// a centered, shaking gift to show loading status
function Loading(): JSX.Element {
  return (
    <div className="shake-slow shake-constant">
      <img className="footerlogo" id="loadingResults" src="./App-logo.png" alt=""></img>
    </div>
  )
}

export default Loading;