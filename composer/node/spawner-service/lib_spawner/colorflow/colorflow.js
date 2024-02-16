const colorflow = require("./build/Release/colorflow");

module.exports = function getMedianColor(imageName){
  try{
    return colorflow.getAverageColor(imageName);
  }
  catch (err){
    throw err;
  }
}