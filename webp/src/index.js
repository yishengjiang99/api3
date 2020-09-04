import ReactDOM from 'react-dom';
import React, { useState } from 'react';



ReactDOM.render(<div>d</div>, document.querySelector("body"));



if (module.hot) {
  module.hot.accept('./print.js', function () {
    console.log('Accepting the updated printMe module!');
    printMe();
  })
}
