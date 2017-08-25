var names =
  ["Alpha"
  , "Brava"
  , "Charlie"
  , "Delta"
  , "Echo"
  , "Foxtrot"
  , "Golf"
  , "Hotel"
  , "India"
  , "Juliet"
  , "Kilo"
  , "Lima"
  , "Mike"
  , "November"
  , "Oscar"
  , "Papa"
  , "Quebec"
  , "Romeo"
  , "Sierra"
  , "Tango"
  , "Uniform"
  , "Victor"
  , "Whiskey"
  , "Xray"
  , "Yankee"
  , "Zulu"

];

var customnames = {
  random : function () {
    var count = names.length;
    var index = Math.floor(Math.random() * count);
    var result = names[index];

    // console.log('count / index / result');
    // console.log(count);
    // console.log(index);
    // console.log(result);

    return result;
  },
  count: function() {
    return names.length;
  },
  push: function(name) {
    names.push(name);
  }
}

// handle command line args, eg test
process.argv.forEach(function (val, index, array) {
  //console.log(index + ': ' + val);
  if (index == 2) {
    // run test
    var name = customnames.random();
    console.log(name);
  }
});

module.exports = customnames;
