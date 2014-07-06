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
  
    var app = angular.module('powerdown', ['ngAnimate']);
    
    app.config(function($locationProvider) {
      $locationProvider.html5Mode(true).hashPrefix('!');
    })
    
    app.controller('InitialFormController', ['$scope', '$http', '$location', function($scope, $http, $location){
      var ctrl = this;
      function perform_analysis(){
        var start_date;
        var hotx=[];
        var hoty=[];
        var coldx=[];
        var coldy=[];
        for (var i=0;i<ctrl.bills.length;i++){
          var bill=ctrl.bills[i];
          var end_date=bill.end_date;
          
          var cumulative_amount=0;
          var cumulative_cost=0;
          for(var j=0;j<bill.energy.length;j++){
            cumulative_amount+=parseFloat(bill.energy[j].amount);
            cumulative_cost+=parseFloat(bill.energy[j].rate*bill.energy[j].amount);
          }
          
          if (start_date){
            var hdd=heatingDegreeDays(start_date,end_date,parseFloat(ctrl.thermostat_threshold_winter));
            var cdd=coolingDegreeDays(start_date,end_date,parseFloat(ctrl.thermostat_threshold_summer));
            var cumulative_hdd=hdd[0]+hdd[1]+hdd[2];
            var cumulative_cdd=cdd[0]+cdd[1]+cdd[2];
            if (cumulative_hdd>cumulative_cdd){
              console.log("Heating:");
              console.log(cumulative_hdd);
              hotx.push(cumulative_hdd);
              hoty.push(cumulative_amount);
            }else{
              console.log("Cooling");
              console.log(cumulative_cdd);
              coldx.push(cumulative_cdd);
              coldy.push(cumulative_amount);
            }
          }
          start_date=end_date;
        }
        console.log(hotx)
        console.log(hoty)
        console.log(coldx)
        console.log(coldy)
        hot_fit=findLineByLeastSquares(hotx,hoty);
        cold_fit=findLineByLeastSquares(coldx,coldy);
        console.log(hot_fit);
        console.log(cold_fit);
      }
      $scope.building_types = building_types;
      $scope.energy_types = energy_types;
      
      this.pushBill = function() {
        ctrl.bills.push({
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
        });
      }
      
      var dataout = JSON.parse(localStorage.getItem('data'));
      if (dataout !== null) {
        this.building_type = dataout[0];
        this.energy_type = dataout[1];
        this.thermostat_threshold_summer = dataout[2];
        this.thermostat_threshold_winter = dataout[3];
        this.bills = dataout[4];
      } else {
        this.building_type = "";
        this.energy_type = "";
        this.thermostat_threshold_summer = 23;
        this.thermostat_threshold_winter = 20;
        
        this.bills = [];
        this.pushBill();
        this.pushBill();
      }
      
      this.isGas = function() {
        return ctrl.energy_type === GAS_TYPE;
      }
      this.isElectric = function() {
        return ctrl.energy_type === ELECTRIC_TYPE;
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
        if (ctrl.pageNumber === 1){
          localStorage.setItem('data', JSON.stringify([this.building_type,
            this.energy_type, this.thermostat_threshold_winter,
            this.thermostat_threshold_summer, ctrl.bills]));
          perform_analysis();
        }
        ctrl.pageNumber += 1;
        $location.hash(ctrl.pageNumber);
      }
      $http({method: 'GET', url: 'http://api.openweathermap.org/data/2.5/forecast?q=Toronto,ca&mode=xml'}).success(function(data) {
          //ctrl.weather = data;
          
          var parser = new DOMParser();
          var doc = parser.parseFromString(data, "application/xml");
          ctrl.next24HourTemps = []; // Size 8
          ctrl.next24Hours = []; // Size 8
          
          for (var i = 0; i < 8; i++) {
            ctrl.next24HourTemps[i] = doc.getElementsByTagName("temperature")[i].getAttribute('value');
            ctrl.next24Hours[i] = doc.getElementsByTagName("time")[i].getAttribute('from');
          }
          
        });
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
