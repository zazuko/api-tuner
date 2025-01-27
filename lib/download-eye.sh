curl -L https://github.com/eyereasoner/eye/archive/refs/tags/v"${EYE_VERSION}".tar.gz -o eye.tar.gz

tar -xvzf eye.tar.gz
rm eye.tar.gz

mv eye-"${EYE_VERSION}" eye
