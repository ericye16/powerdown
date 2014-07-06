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
              hoty.push(cumulative_cost);
            }else{
              console.log("Cooling");
              console.log(cumulative_cdd);
              coldx.push(cumulative_cdd);
              coldy.push(cumulative_cost);
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
        var temps=ctrl.next24HourTemps;
        var hourly_dollars=[];
        console.log(temps);
        for(var i=0;i<temps.length;i++){
          if(temps[i]<ctrl.thermostat_threshold_winter){
            hourly_dollars.push(temps[i]*hot_fit[0]*3/24)/100;
          } else if(temps[i]>ctrl.thermostat_threshold_summer){
            hourly_dollars.push(temps[i]*cold_fit[0]*3/24)/100;
          }
        }
        set_data(hourly_dollars);
      }
      this.next24HourTemps = [];
      this.next24Hours = [];
      
      this.getData = function() {
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
        });
      };
      this.getData();
      $scope.building_types = building_types;
      $scope.energy_types = energy_types;
      
      this.pushBill = function() {
        ctrl.bills.push({
          end_date: null,
          energy : [{
            amount: null,
            rate: null,
          }],
          pushEnergyPair: function(energy) {
            energy.push({
              amount: null,
              rate: null,
            })
          }
        });
      }
      
      
      this.billValidated = function(bill) {
        var loopsOK = true;
        for (var i = 0; i < bill.energy.length; i++) {
          loopsOK = loopsOK && !isNaN(parseFloat(bill.energy[i].amount))
          loopsOK = loopsOK && !isNaN(parseFloat(bill.energy[i].rate));
        }
        return (
          (bill.end_date !== undefined && bill.end_date !== '' && bill.end_date !== null) && (new Date(bill.end_date) !== 'Invalid Date') && loopsOK);
      }
      this.formValidated = function() {
        var billsOK = true;
        for (var i = 0; i < ctrl.bills.length; i++) {
          billsOK = billsOK && ctrl.billValidated(ctrl.bills[i]);
        }
        return (
          ctrl.building_type !== "" &&
          ctrl.energy_type !== "" &&
          !isNaN(parseFloat(ctrl.thermostat_threshold_summer)) &&
          !isNaN(parseFloat(ctrl.thermostat_threshold_winter)) &&
          ctrl.bills.length >= 3 &&
          billsOK)
      }
      
      var setup = function() {
        ctrl.building_type = "";
        ctrl.energy_type = "";
        ctrl.thermostat_threshold_summer = 23;
        ctrl.thermostat_threshold_winter = 20;
        
        ctrl.bills = [];
        ctrl.pushBill();
        ctrl.pushBill();
        ctrl.pushBill();
      }
      
      var dataout = JSON.parse(localStorage.getItem('data'));
      if (dataout !== null) {
        this.building_type = dataout[0];
        this.energy_type = dataout[1];
        this.thermostat_threshold_summer = dataout[2];
        this.thermostat_threshold_winter = dataout[3];
        this.bills = dataout[4];
        if (!this.formValidated()) {
          setup();
        }
      } else {
        setup();
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
      this.runOn = function(n) {
        if (n === 2){
          localStorage.setItem('data', JSON.stringify([this.building_type,
            this.energy_type, this.thermostat_threshold_winter,
            this.thermostat_threshold_summer, ctrl.bills]));
          ctrl.getData();
          perform_analysis();
        }
      }
      this.runOn(this.pageNumber);
      this.page = function(n) {
        return n === ctrl.pageNumber;
      }
      this.backPage = function() {
        ctrl.pageNumber -= 1;
        $location.hash(ctrl.pageNumber);
        ctrl.runOn(ctrl.pageNumber);
      }
      this.nextPage = function() {
        ctrl.pageNumber += 1;
        $location.hash(ctrl.pageNumber);
        ctrl.runOn(ctrl.pageNumber);
      }
      this.helpImage = false;
      this.helpImageToggle = function() {
        this.helpImage = (this.helpImage) ? false : true;
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
