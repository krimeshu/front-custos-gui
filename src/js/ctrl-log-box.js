/**
 * Created by krimeshu on 2016/3/13.
 */
var Logger = require('./logger.js');

module.exports = function LogBoxController($scope) {
    $scope.logList = Logger.logList;
};