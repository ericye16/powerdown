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
  
    var app = angular.module('powerdown', ['ngAnimate']);
    
    app.config(function($locationProvider) {
      $locationProvider.html5Mode(true).hashPrefix('!');
    })
    
    app.controller('InitialFormController', ['$scope', '$http', '$location', function($scope, $http, $location) {
      $scope.building_types = building_types;
      $scope.energy_types = energy_types;

      this.building_type = "";
      this.energy_type = "";
      this.gas_supply_rate = 21.4;
      this.gas_used = 45.86;
      this.thermostat_threshold_summer = 23;
      this.thermostat_threshold_winter = 20;
      
      this.bills = [];
      this.current_bill = {
        end_date: null,
        energy: [{
          amount: 0,
          rate: 0,
        }],
        pushEnergyPair: function(energy) {
          energy.push({
            amount: 0,
            rate: 0,
          })
        }
      }
      
      this.isGas = function() {
        return ctrl.energy_type === GAS_TYPE;
      }
      this.isElectric = function() {
        return ctrl.energy_type === ELECTRIC_TYPE;
      }
      this.pushBill = function() {
        ctrl.bills.push(ctrl.current_bill);
        ctrl.current_bill = {
          end_date: null,
          energy : [{
            amount: 0,
            rate: 0,
          }],
          pushEnergyPair: function(energy) {
          energy.push({
            amount: 0,
            rate: 0,
          })
        }
        }
      }

      this.pageNumber = parseInt($location.hash(), 10);
      if (isNaN(this.pageNumber) || this.pageNumber > 3 || this.pageNumber < 1) {
        this.pageNumber = 1;
        $location.hash(this.pageNumber);
      }
      this.page = function(n) {
        return n === ctrl.pageNumber;
      }
      this.backPage = function() {
        ctrl.pageNumber -= 1;
        $location.hash(ctrl.pageNumber);
      }
      this.nextPage = function() {
        ctrl.pageNumber += 1;
        $location.hash(ctrl.pageNumber);
      }
      
      var ctrl = this;
      $http({method: 'GET', url: 'http://api.openweathermap.org/data/2.5/forecast?q=Toronto,ca&mode=xml'}).success(function(data) {
          //ctrl.weather = data;
          
          var parser = new DOMParser();
          var doc = parser.parseFromString(data, "application/xml");
          ctrl.next24HourTemps = []; // Size 8
          ctrl.next24Hours = []; // Size 8
          
          // Extract useful values for 24 hour projection
          for (var i = 0; i < 8; i++) {
            ctrl.next24HourTemps[i] = doc.getElementsByTagName("temperature")[i].getAttribute('value');
            ctrl.next24Hours[i] = doc.getElementsByTagName("time")[i].getAttribute('from');
          }
          
          // Calculate the money amounts
          
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
