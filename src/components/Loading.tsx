import gif from '../loading_gif.gif'

// a centered, shaking gift to show loading status
function Loading(): JSX.Element {
  return (
    <div>
      <img className="footerlogo" id="loadingResults" src={gif} alt=""></img>
      <p className="text-gray-400 text-sm pt-6">LOADING...</p>
    </div>
  )
}

export default Loading;