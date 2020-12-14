#!/bin/sh

## OVERVIEW
# This script is used to create a support branch.
# Support branches are used for patching micro releases that have already been released to the public.

## USAGE
# Call the script to create a support branch. Once the support branch is created, you can create a development branch 
# just like normal. The only difference is the development branch should be made from the support branch (instead of 
# master) and will be merged back into the support branch.

## NOTE
# Support branches are long-lived and should NOT be deleted once they are created.

read -p "What major.minor version would you like to create a support branch for? (X.X): " VERSION
BRANCH="support/$VERSION"

VERSION_REGEX="^([0-9]+)\.([0-9]+)"

if ! [[ $VERSION =~ $VERSION_REGEX ]]; then
    echo "That is a an invalid version.  Please enter a valid MAJOR.MINOR version."
else
    echo "valid version"
    if git branch -r | grep -q "origin/${BRANCH}"; then
        echo 'Support branch already exists, checking out support branch'
        git checkout $BRANCH
    else
        ERROR_MSG="ERROR: please ensure you have no pending changes and that the specified version is released and has a release tag. Exiting..."
        git checkout -q "v$VERSION" && git checkout -b $BRANCH || echo $ERROR_MSG
        SUCCESS_MSG="SUCCESS!  Your support branch has been created and pushed to gitlab.  You are now ready to start working on patches for $VERSION."
        git push --set-upstream origin $BRANCH && echo $SUCCESS_MSG
    fi
fi
