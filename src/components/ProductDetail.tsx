import { useParams } from "react-router-dom";
import { useIdeas } from "../utils/hooks";
import "./ProductDetails.css";
import "../homepage.scss";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import { Popup } from "reactjs-popup";

function ProductDetail(): JSX.Element {
  const { data: suggestions, loading: isLoading } = useIdeas();
  const { id } = useParams();

  let index;
  if (id === undefined) {
    index = 0;
  } else {
    index = parseInt(id);
  }

  //suggestions are offset by 2, initial gift's row_id in useIdeas() is 2
  const g = suggestions.at(index - 2);

  return (
    <div>
      <div id="total-container">
        <div id="back-to-results-button">
          <Link to="/results"> {"< "} Back to quiz results</Link>
        </div>
        <br />
        <br />
        <div
          id="product-details-container"
          className="flex flex-col lg:flex-row bg-white shadow rounded-lg"
        >
          <div id="img-container">
            <img
              id="product-image"
              className="object-cover w-full h-48"
              src={g?.photo}
              alt="Gift img"
            />
          </div>

          <div className="relative p-4 lg:w-2/3">
            <Popup
              trigger={
                <div id="share-button">
                  <button > 
                    <p id="share-text" >Share</p>
                    <svg id="share-icon" className="h-7 w-7 text-white"  width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">  
                      <path stroke="none" d="M0 0h24v24H0z"/>  
                      <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
                    </svg>
                  </button>
                </div>
              }
              position="top right"
            >
              <div style={{ display: "flex" }}>
                <a href={g?.mailToLink}>
                  <svg
                    className="h-8 w-8 text-black"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                </a>

                <a href={g?.smsToLink}>
                  <svg
                    className="h-8 w-8 text-black"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <path d="M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4" />
                    <line x1="8" y1="9" x2="16" y2="9" />
                    <line x1="8" y1="13" x2="14" y2="13" />
                  </svg>
                </a>
              </div>
            </Popup>

            <div id="product-detail-brand">{g?.brand}</div>
            <div id="product-detail-title">{g?.gift}</div>
            <div id="product-detail-price">{g?.actualPrice}</div>
            <div id="product-detail-description">{g?.description}</div>
            <div id="product-button-group">
              <button id="card_button_a">
                <a href={g?.link} target="_blank" rel="noreferrer">
                  Buy Now
                </a>
              </button>
              <button id="card_button_a">
                <a href={g?.groupLink} target="_blank" rel="noreferrer">
                  Group Gift
                </a>
              </button>
            </div>
            <Popup
              trigger={
                <button id="group-gift-info-link">
                  {" "}
                  What is a group gift?
                </button>
              }
              position="bottom center"
            >
              <div>
                Group gifting is an easy way to split the cost of a gift with
                others.
                <br /> Learn more about group gifting at{" "}
                <a href="https://www.getpresently.com/about">
                  getpresently.com/about
                </a>
                .
              </div>
            </Popup>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ProductDetail;
