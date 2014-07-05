(function() {
    
    //building types
    var HOME_TYPE = "home";
    var UNIT_TYPE = "unit";
    var BUILDING_TYPE = "building";
    
    //energy types
    var ELECTRIC_TYPE = "electric";
    var GAS_TYPE = "gas";
  
    var app = angular.module('powerdown', []);
    
    app.controller('InitialFormController', function($scope) {
      this.building_type = "";
      this.energy_type = "";
      
      if (this.energy_type === ELECTRIC_TYPE) {
        /*
         * Electric power on bills is tiered.
         * For example, the bill will say 750.000 kWh at $0.066 per kWh
         * + 1,481.000 at $0.101 per kWh
         * if they used 2,231 kWh in a month.
         * 
         */
        
        this.electricUse = [{energy: 0, rate: 0}];
      } else if (this.energy_type === GAS_TYPE) {
        /*
         * Gas power (doesn't appear tiered) requires volume of gas and
         * rate it comes at.
         * These are all on page 2 of the bill.
         */
        this.gasUse = {energy: 0, rate: 0};
      }
      
      
    });
})();
