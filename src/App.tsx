import React from 'react';
import './App.css';

const API = "https://v1.nocodeapi.com/qlangstaff/google_sheets/cIMNrJLsqTxDGZCn?tabId=Gifts&perPage=500&page=1&valueRenderOption=FORMATTED_VALUE?";

// Added any type to fix typescript errors
class App extends React.Component<{},any> {

  constructor(props: any){
    super(props);

    this.state = {
      items:[]
    };
  }

  componentDidMount(){

    fetch(API).then(response => response.json()).then(data => {
      // Added try and catch to fix error: Cannot read property '0' of undefined
      try {
        // Copied this from a website but not sure if it's correct
        let batchRowValues = data.valueRanges[0].values;
        const rows: any = [];

        for (let i = 1; i < batchRowValues.length; i++) {
          let rowObject: any = {};
          for (let j = 0; j < batchRowValues[i].length; j++) {
            rowObject[batchRowValues[0][j]] = batchRowValues[i][j];
          }
          rows.push(rowObject);
        }
        this.setState({ items: rows });
      } 
      catch (err) {
      }
    });
  }

  render() {
    // Displays an array in console but says length is zero & "Value was evaluated upon first expanding. It may have changed since then."
    console.log(this.state.items);
    const listItems = this.state.items.map((item: any) =>
    <li>{item.Gift}, {item.Link}</li>
    );

    return (
      // App title page and data should render below
      // I want to move the rendered data to the very bottom of the page instead (below quiz structure)
      // Quiz structure is in index.html but not sure if it should be moved to App.tsx
      <div>
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">GIFT PICKER 🎁</h1>
              <p>By <a href="https://getpresently.com" target="_blank" rel="noreferrer">Presently</a> 💜</p>
              <p>Helping you pick the perfect gift for any occasion</p>
          </header>
        </div>
        <div>
          <ul>{listItems}</ul>
        </div>
      </div>
    );
  }
}

export default App;


