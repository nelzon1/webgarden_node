#!/bin/bash
#
# Take an image and send it cloud server
# Take the image
./getImage.sh

## Get current date ##
_now=$(date +"%Y-%m-%d_%H-%M-%S")
 
## Appending a current date from a $_now to a filename stored in $_file ##
_file="/home/pi/webgarden/proc/imgArchive/img_$_now.jpg"
 
## Copy latest image into new ##
echo "Copying latest image to $_file..."
cp /home/pi/webgarden/proc/LatestImage.jpg "$_file"

curl \
 -F "filecomment=Webgarden image" \
 -F "date = getDate" \
 -F image=@$_file \
 cloud.jpnelson.ca/uploadImage

rm $_file