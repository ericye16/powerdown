(function() {
    
    //building types
    var HOME_TYPE = "home";
    var UNIT_TYPE = "unit";
    var BUILDING_TYPE = "building";
    
    var building_types = [
      {id: HOME_TYPE,
        name: "Home Owner"},
      {id: UNIT_TYPE,
        name: "Unit Owner"},
      {id: BUILDING_TYPE,
        name: "Building Owner"}
    ];
    
    //energy types
    var ELECTRIC_TYPE = "Electric";
    var GAS_TYPE = "Gas";
  
    var energy_types = [
      {id: ELECTRIC_TYPE,
        name: "Electric"},
      {id: GAS_TYPE,
        name: "Gas"},
    ];
    
    var bills = [];
  
    var app = angular.module('powerdown', []);
    
    app.controller('InitialFormController', ['$scope', '$http', function($scope, $http) {
      $scope.building_types = building_types;
      $scope.energy_types = energy_types;

      this.building_type = "";
      this.energy_type = "";
      this.current_bill = {};

      this.pageNumber = 1;
      this.page = function(n) {
        return n === ctrl.pageNumber;
      }
      this.backPage = function() {
        ctrl.pageNumber -= 1;
      }
      this.nextPage = function() {
        ctrl.pageNumber += 1;
      }
      
      var ctrl = this;
      $http({method: 'GET', url: 'http://api.openweathermap.org/data/2.5/forecast?q=Toronto,ca&mode=xml'}).success(function(data) {
          //console.log(data);
          //ctrl.weather = data;
          
          var parser = new DOMParser();
          var doc = parser.parseFromString(data, "application/xml");
          ctrl.weather = doc.getElementsByTagName("temperature")[0].getAttribute('value');
          //console.log(temperature)
          
        });
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
        this.gasUse = [{energy: 0, rate: 0}];
      }
      
      
    }]);
    
    app.directive('graphpage', function() {
      return {
        restrict: 'E',
        templateUrl: "graphpage.html",
      }
    })
    
    app.directive('formpage', function() {
      return {
        restrict: 'E',
        templateUrl: 'formpage.html',
      }
    })
    
    app.directive('improvementspage', function() {
      return {
        restrict: 'E',
        templateUrl: 'improvements.html'
      }
    })
})();
