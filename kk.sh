lsof -i tcp:443 |awk '{print $2}' |xargs kill -9
