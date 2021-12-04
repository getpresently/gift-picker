import { useParams } from "react-router-dom";
import {useIdeas} from '../utils/hooks';
import "./ProductDetails.css";

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
    console.log(g)
    return (
        <>
        <div id="back-to-results-button">
            <p> {"< "} Back to quiz results</p>
        </div>
        
        <div id="product-details-container">
            <img id="product-image" src={g?.photo}></img>
            <div id="product-details"> 
                <div id="product-detail-brand">{g?.brand}</div>
                <div id="product-detail-title">{g?.gift}</div>
                <div id="product-detail-description">{g?.description}</div>
                <div id="product-detail-price">{g?.actualPrice}</div>
                <div id="product-button-group">
                    <button id="card_button_a">
                        <a href={g?.link} target="_blank" rel="noreferrer">
                        View Gift
                        </a>
                    </button>
                    <button id="card_button_a">
                        <a href={g?.groupLink} target="_blank" rel="noreferrer">
                        Split Cost
                        </a>
                    </button>
                </div>
            </div>
        </div>
        </>
    )
}


export default ProductDetail;