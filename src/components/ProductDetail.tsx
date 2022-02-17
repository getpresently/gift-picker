import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useIdeas } from "../utils/hooks";
import "./ProductDetails.css";
import "../homepage.scss";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import { Popup } from "reactjs-popup";
import Loading from "./Loading";

function ProductDetail(): JSX.Element {
  const { data: suggestions, loading: isLoading } = useIdeas();
  const { id } = useParams();
  const [index, setIndex] = useState(0);
  const [g, setG] = useState(suggestions);

  useEffect(() => {
    if (id === undefined) {
      setIndex(0);
    } else {
      setIndex(parseInt(id));
    }
    setG(suggestions.filter((i) => parseInt(i.rowId.toString()) === index));
  }, [id, suggestions]);

  return (
    <div>
      {isLoading ? (
        <Loading />
      ) : g.length === 0 ? (
        <div>
          <div id="no-gifts-container">
            <div id="back-to-results-button">
              <Link to="/results"> {"< "} Back to quiz results</Link>
            </div>
            <br />
            <div id="card">This gift does not exist</div>
          </div>
          <Footer />
        </div>
      ) : (
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
                  // id="product-image"
                  // className="object-cover w-full h-48 rounded-xl"
                  className="object-cover w-full h-48 rounded-xl lg: h-72"
                  src={g[0].photo}
                  alt="Gift img"
                />
              </div>

              <div className="relative p-4 lg:w-full">
                <Popup
                  trigger={
                    <div id="share-button" className="mr-10 mb-5">
                      <button>
                        <p id="share-text">Share</p>
                        <svg
                          id="share-icon"
                          className="h-7 w-7 text-white"
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
                          <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
                        </svg>
                      </button>
                    </div>
                  }
                  position="top right"
                >
                  <div style={{ display: "flex" }}>
                    <a href={g[0].mailToLink}>
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

                    <a href={g[0].smsToLink}>
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

                <div id="product-detail-brand">{g[0].brand}</div>
                <div id="product-detail-title">{g[0].gift}</div>
                <div id="product-detail-price">{g[0].actualPrice}</div>
                <div id="product-detail-description">{g[0].description}</div>
                <div id="product-button-group">
                  <button id="card_button_a">
                    <a href={g[0].link} target="_blank" rel="noreferrer">
                      Buy Now
                    </a>
                  </button>
                  <button id="card_button_a">
                    <a href={g[0].groupLink} target="_blank" rel="noreferrer">
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
                    Group gifting is an easy way to split the cost of a gift
                    with others.
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
      )}
    </div>
  );
}

export default ProductDetail;
