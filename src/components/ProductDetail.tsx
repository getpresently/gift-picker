import { useParams } from "react-router-dom";
import {useIdeas} from '../utils/hooks';


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
        <div>
            <p>HELLO</p>
            <p>{g?.gift}</p>
            <p>{g?.brand}</p>

        </div>
    )
}


export default ProductDetail;