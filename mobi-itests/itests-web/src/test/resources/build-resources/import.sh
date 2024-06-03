# First argument is repository id. Second argument is path to file to import
(r=5;while ! (/opt/mobi/${distribution}/bin/client "mobi:import -r $1 $2"); do ((--r))||exit;echo "Waiting for ${distributionName} shell...";sleep 5;done)
