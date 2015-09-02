/** @jsx React.DOM */

var React = require('react');

var Header = require('./Header');

var Index = React.createClass({

  render: function () {
    return (
      <div className="content">
        <Header />
        {/*<div className="body">
          {Array(200).join().split(',').map((_, i) =>
            <div key={i}>Lorem Ipsum</div>
          )}
        </div>*/}
      </div>
    );
  }

});

module.exports = Index;
