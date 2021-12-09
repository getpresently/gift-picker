import { useParams } from "react-router-dom";
import {useIdeas} from '../utils/hooks';
import "./ProductDetails.css";
import "../homepage.scss"
import Footer from "./Footer"
import {Link} from "react-router-dom"



function ProductDetail(): JSX.Element {
    const {data: suggestions, loading: isLoading} = useIdeas();
    const {id} = useParams();
    
    let index;
    if(id === undefined){
        index = 0;
    } else {
        index = parseInt(id);
    }

    
    const g = suggestions.at(index-2)

    return (
        <div>
            <div id="total-container">
                <div id="back-to-results-button">
                    <Link to="/results"> {"< "} Back to quiz results</Link>
                </div>
                
                <div id="product-details-container" className="flex flex-col lg:flex-row bg-white shadow w-full rounded-lg">
                    <img id="product-image"
                        className="object-cover w-full h-48"
                        src={g?.photo}
                        alt="Flower and sky"
                        />

                    <div className="relative p-4 lg:w-1/8">
                            <div id="share-button">
                                <a href=""> Share </a>
                            </div>
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
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}


export default ProductDetail;