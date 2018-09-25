#!/usr/bin/env bash
TOKEN=""
#curl "https://s3.eu-de.objectstorage.softlayer.net/cog-1/"  -H "Authorization: bearer $TOKEN"
#curl --head "https://s3.eu-de.objectstorage.softlayer.net/cog-1/cog-vietnam.tif"  -H "Authorization: bearer $TOKEN"

# Check object's ACL
#curl  "https://s3.eu-de.objectstorage.softlayer.net/cog-1/cog-example.tif?acl"  -H "Authorization: bearer $TOKEN"

## Allow anonymous access to an object
curl -X "PUT" "https://s3.eu-de.objectstorage.softlayer.net/cog-1/cog-vietnam.tif?acl"  -H "Authorization: bearer $TOKEN" \
 -H "Content-Type: image/tiff" \
 -H "x-amz-acl: public-read"

# GET IAM via API
#curl -k -X POST \
#  --header "Content-Type: application/x-www-form-urlencoded" \
#  --header "Accept: application/json" \
#  --data-urlencode "grant_type=urn:ibm:params:oauth:grant-type:apikey" \
#  --data-urlencode "apikey=api_key" \
#  "https://iam.bluemix.net/identity/token"

echo ""