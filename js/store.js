const electron = require('electron');
const path     = require('path');
const fs       = require('fs');

class Store
{
  constructor(opts)
  {
    this.userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.exportedJSON;
  }

  check_path(jName)
  {
    var userDataPath = (electron.app || electron.remote.app).getPath('userData');
    var jPath        = path.join(userDataPath, jName + '.json');
    
    return fs.existsSync(jPath);
  }

  save(configName, custJSON) 
  {
    var jPath = path.join(this.userDataPath, configName + '.json');

    if(!custJSON)
    {
      fs.writeFileSync(jPath, JSON.stringify(this.exportedJSON));
    }
    else{
      fs.writeFileSync(jPath, JSON.stringify(custJSON));
    }
  }
  
  getJSON(configName)
  {
    var jPath = path.join(this.userDataPath, configName + '.json');
    return JSON.parse(fs.readFileSync(jPath));
  }
}

module.exports = Store;