// function loadTexture(gl, url) {
//     const texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);

//     // Temporary 1x1 pixel until image is loaded
//     const level = 0;
//     const internalFormat = gl.RGBA;
//     const width = 1;
//     const height = 1;
//     const border = 0;
//     const srcFormat = gl.RGBA;
//     const srcType = gl.UNSIGNED_BYTE;
//     const pixel = new Uint8Array([255, 0, 255, 255]); // magenta pixel as placeholder
//     gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

//     // Load the actual image
//     const image = new Image();
//     image.onload = function() {
//         gl.bindTexture(gl.TEXTURE_2D, texture);
//         gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

//         // Check if image dimensions are power of 2, and set appropriate parameters
//         if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
//             gl.generateMipmap(gl.TEXTURE_2D ,gl.TEXTURE_TRANSPARENCY, gl.ALPHA);
//         } else {
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//             gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_TRANSPARENCY, gl.ALPHA);
//         }
//     };
//     image.crossOrigin = "Anonymous";
//     image.src = url; // Set the image source to start loading

//     return texture;
// }



// read models in, load them into webgl buffers
// function loadModels() {
    
//     // make an ellipsoid, with numLongSteps longitudes.
//     // start with a sphere of radius 1 at origin
//     // Returns verts, tris and normals.
//     function makeEllipsoid(currEllipsoid,numLongSteps) {
        
//         try {
//             if (numLongSteps % 2 != 0)
//                 throw "in makeSphere: uneven number of longitude steps!";
//             else if (numLongSteps < 4)
//                 throw "in makeSphere: number of longitude steps too small!";
//             else { // good number longitude steps
            
//                 console.log("ellipsoid xyz: "+ ellipsoid.x +" "+ ellipsoid.y +" "+ ellipsoid.z);
                
//                 // make vertices
//                 var ellipsoidVertices = [0,-1,0]; // vertices to return, init to south pole
//                 var angleIncr = (Math.PI+Math.PI) / numLongSteps; // angular increment 
//                 var latLimitAngle = angleIncr * (Math.floor(numLongSteps/4)-1); // start/end lat angle
//                 var latRadius, latY; // radius and Y at current latitude
//                 for (var latAngle=-latLimitAngle; latAngle<=latLimitAngle; latAngle+=angleIncr) {
//                     latRadius = Math.cos(latAngle); // radius of current latitude
//                     latY = Math.sin(latAngle); // height at current latitude
//                     for (var longAngle=0; longAngle<2*Math.PI; longAngle+=angleIncr) // for each long
//                         ellipsoidVertices.push(latRadius*Math.sin(longAngle),latY,latRadius*Math.cos(longAngle));
//                 } // end for each latitude
//                 ellipsoidVertices.push(0,1,0); // add north pole
//                 ellipsoidVertices = ellipsoidVertices.map(function(val,idx) { // position and scale ellipsoid
//                     switch (idx % 3) {
//                         case 0: // x
//                             return(val*currEllipsoid.a+currEllipsoid.x);
//                         case 1: // y
//                             return(val*currEllipsoid.b+currEllipsoid.y);
//                         case 2: // z
//                             return(val*currEllipsoid.c+currEllipsoid.z);
//                     } // end switch
//                 }); 

//                 // make normals using the ellipsoid gradient equation
//                 // resulting normals are unnormalized: we rely on shaders to normalize
//                 var ellipsoidNormals = ellipsoidVertices.slice(); // start with a copy of the transformed verts
//                 ellipsoidNormals = ellipsoidNormals.map(function(val,idx) { // calculate each normal
//                     switch (idx % 3) {
//                         case 0: // x
//                             return(2/(currEllipsoid.a*currEllipsoid.a) * (val-currEllipsoid.x));
//                         case 1: // y
//                             return(2/(currEllipsoid.b*currEllipsoid.b) * (val-currEllipsoid.y));
//                         case 2: // z
//                             return(2/(currEllipsoid.c*currEllipsoid.c) * (val-currEllipsoid.z));
//                     } // end switch
//                 }); 
                
//                 // make triangles, from south pole to middle latitudes to north pole
//                 var ellipsoidTriangles = []; // triangles to return
//                 for (var whichLong=1; whichLong<numLongSteps; whichLong++) // south pole
//                     ellipsoidTriangles.push(0,whichLong,whichLong+1);
//                 ellipsoidTriangles.push(0,numLongSteps,1); // longitude wrap tri
//                 var llVertex; // lower left vertex in the current quad
//                 for (var whichLat=0; whichLat<(numLongSteps/2 - 2); whichLat++) { // middle lats
//                     for (var whichLong=0; whichLong<numLongSteps-1; whichLong++) {
//                         llVertex = whichLat*numLongSteps + whichLong + 1;
//                         ellipsoidTriangles.push(llVertex,llVertex+numLongSteps,llVertex+numLongSteps+1);
//                         ellipsoidTriangles.push(llVertex,llVertex+numLongSteps+1,llVertex+1);
//                     } // end for each longitude
//                     ellipsoidTriangles.push(llVertex+1,llVertex+numLongSteps+1,llVertex+2);
//                     ellipsoidTriangles.push(llVertex+1,llVertex+2,llVertex-numLongSteps+2);
//                 } // end for each latitude
//                 for (var whichLong=llVertex+2; whichLong<llVertex+numLongSteps+1; whichLong++) // north pole
//                     ellipsoidTriangles.push(whichLong,ellipsoidVertices.length/3-1,whichLong+1);
//                 ellipsoidTriangles.push(ellipsoidVertices.length/3-2,ellipsoidVertices.length/3-1,
//                                         ellipsoidVertices.length/3-numLongSteps-1); // longitude wrap
//             } // end if good number longitude steps
//             return({vertices:ellipsoidVertices, normals:ellipsoidNormals, triangles:ellipsoidTriangles});
//         } // end try
        
//         catch(e) {
//             console.log(e);
//         } // end catch
//     } // end make ellipsoid
    
//     inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles"); // read in the triangle data

//     try {
//         if (inputTriangles == String.null)
//             throw "Unable to load triangles file!";
//         else {
//             var whichSetVert; // index of vertex in current triangle set
//             var whichSetTri; // index of triangle in current triangle set
//             var vtxToAdd; // vtx coords to add to the coord array
//             var normToAdd; // vtx normal to add to the coord array
//             var triToAdd; // tri indices to add to the index array
//             var maxCorner = vec3.fromValues(Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE); // bbox corner
//             var minCorner = vec3.fromValues(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE); // other corner
        
//             // process each triangle set to load webgl vertex and triangle buffers
//             numTriangleSets = inputTriangles.length; // remember how many tri sets
//             for (var whichSet=0; whichSet<numTriangleSets; whichSet++) { // for each tri set
                
//                 // set up hilighting, modeling translation and rotation
//                 inputTriangles[whichSet].center = vec3.fromValues(0,0,0);  // center point of tri set
//                 inputTriangles[whichSet].on = false; // not highlighted
//                 inputTriangles[whichSet].translation = vec3.fromValues(0,0,0); // no translation
//                 inputTriangles[whichSet].xAxis = vec3.fromValues(1,0,0); // model X axis
//                 inputTriangles[whichSet].yAxis = vec3.fromValues(0,1,0); // model Y axis 

//                 // set up the vertex and normal arrays, define model center and axes
//                 inputTriangles[whichSet].glVertices = []; // flat coord list for webgl
//                 inputTriangles[whichSet].glNormals = []; // flat normal list for webgl
//                 inputTriangles[whichSet].glUVs = [];

//                 var numVerts = inputTriangles[whichSet].vertices.length; // num vertices in tri set
//                 for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) { // verts in set
//                     vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert]; // get vertex to add
//                     normToAdd = inputTriangles[whichSet].normals[whichSetVert]; // get normal to add
//                     const uvToAdd = inputTriangles[whichSet].uvs[whichSetVert];

//                     inputTriangles[whichSet].glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
//                     inputTriangles[whichSet].glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // put normal in set coord list
//                     inputTriangles[whichSet].glUVs.push(uvToAdd[0], uvToAdd[1]);

//                     vec3.max(maxCorner,maxCorner,vtxToAdd); // update world bounding box corner maxima
//                     vec3.min(minCorner,minCorner,vtxToAdd); // update world bounding box corner minima
//                     vec3.add(inputTriangles[whichSet].center,inputTriangles[whichSet].center,vtxToAdd); // add to ctr sum
//                 } // end for vertices in set
//                 vec3.scale(inputTriangles[whichSet].center,inputTriangles[whichSet].center,1/numVerts); // avg ctr sum

//                 // send the vertex coords and normals to webGL
//                 vertexBuffers[whichSet] = gl.createBuffer(); // init empty webgl set vertex coord buffer
//                 gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichSet]); // activate that buffer
//                 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glVertices),gl.STATIC_DRAW); // data in

//                 normalBuffers[whichSet] = gl.createBuffer(); // init empty webgl set normal component buffer
//                 gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichSet]); // activate that buffer
//                 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(inputTriangles[whichSet].glNormals),gl.STATIC_DRAW); // data in

//                 texCoordBuffers[whichSet] = gl.createBuffer();
//                 gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffers[whichSet]);
//                 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inputTriangles[whichSet].glUVs), gl.STATIC_DRAW);
//                 // texCoordBuffers.push(texCoordBuffer);
            
//                 // set up the triangle index array, adjusting indices across sets
//                 inputTriangles[whichSet].glTriangles = []; // flat index list for webgl
//                 triSetSizes[whichSet] = inputTriangles[whichSet].triangles.length; // number of tris in this set
//                 for (whichSetTri=0; whichSetTri<triSetSizes[whichSet]; whichSetTri++) {
//                     triToAdd = inputTriangles[whichSet].triangles[whichSetTri]; // get tri to add
//                     inputTriangles[whichSet].glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list
//                 } // end for triangles in set

//                 // send the triangle indices to webGL
//                 triangleBuffers.push(gl.createBuffer()); // init empty triangle index buffer
//                 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]); // activate that buffer
//                 gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(inputTriangles[whichSet].glTriangles),gl.STATIC_DRAW); // data in

//                 // Load texture if it hasn’t been loaded before
//                 const textureFileTriangle = inputTriangles[whichSet].material.texture;
//                 textureURLs[textureFileTriangle] = loadTexture(gl, `https://ncsucgclass.github.io/prog4/${textureFileTriangle}`);
                
//                 inputTriangles[whichSet].texture = textureURLs[textureFileTriangle];

//             } // end for each triangle set 
        
//             inputEllipsoids = getJSONFile(INPUT_ELLIPSOIDS_URL,"ellipsoids"); // read in the ellipsoids

//             if (inputEllipsoids == String.null)
//                 throw "Unable to load ellipsoids file!";
//             else {
                
//                 // init ellipsoid highlighting, translation and rotation; update bbox
//                 var ellipsoid; // current ellipsoid
//                 var ellipsoidModel; // current ellipsoid triangular model
//                 var temp = vec3.create(); // an intermediate vec3
//                 var minXYZ = vec3.create(), maxXYZ = vec3.create();  // min/max xyz from ellipsoid
//                 numEllipsoids = inputEllipsoids.length; // remember how many ellipsoids
//                 for (var whichEllipsoid=0; whichEllipsoid<numEllipsoids; whichEllipsoid++) {
                    
//                     // set up various stats and transforms for this ellipsoid
//                     ellipsoid = inputEllipsoids[whichEllipsoid];
//                     ellipsoid.on = false; // ellipsoids begin without highlight
//                     ellipsoid.translation = vec3.fromValues(0,0,0); // ellipsoids begin without translation
//                     ellipsoid.xAxis = vec3.fromValues(1,0,0); // ellipsoid X axis
//                     ellipsoid.yAxis = vec3.fromValues(0,1,0); // ellipsoid Y axis 
//                     ellipsoid.center = vec3.fromValues(ellipsoid.x,ellipsoid.y,ellipsoid.z); // locate ellipsoid ctr
//                     vec3.set(minXYZ,ellipsoid.x-ellipsoid.a,ellipsoid.y-ellipsoid.b,ellipsoid.z-ellipsoid.c); 
//                     vec3.set(maxXYZ,ellipsoid.x+ellipsoid.a,ellipsoid.y+ellipsoid.b,ellipsoid.z+ellipsoid.c); 
//                     vec3.min(minCorner,minCorner,minXYZ); // update world bbox min corner
//                     vec3.max(maxCorner,maxCorner,maxXYZ); // update world bbox max corner

//                     // make the ellipsoid model
//                     ellipsoidModel = makeEllipsoid(ellipsoid,32);
    
//                     // send the ellipsoid vertex coords and normals to webGL
//                     vertexBuffers.push(gl.createBuffer()); // init empty webgl ellipsoid vertex coord buffer
//                     gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[vertexBuffers.length-1]); // activate that buffer
//                     gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ellipsoidModel.vertices),gl.STATIC_DRAW); // data in
//                     normalBuffers.push(gl.createBuffer()); // init empty webgl ellipsoid vertex normal buffer
//                     gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[normalBuffers.length-1]); // activate that buffer
//                     gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ellipsoidModel.normals),gl.STATIC_DRAW); // data in
        
//                     triSetSizes.push(ellipsoidModel.triangles.length);
    
//                     // send the triangle indices to webGL
//                     triangleBuffers.push(gl.createBuffer()); // init empty triangle index buffer
//                     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[triangleBuffers.length-1]); // activate that buffer
//                     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ellipsoidModel.triangles),gl.STATIC_DRAW); // data in

//                     const textureFileEllipsoid = ellipsoid.texture;
//                     textureURLs[textureFileEllipsoid] = loadTexture(gl, `https://ncsucgclass.github.io/prog4/${textureFileEllipsoid}`);
                
//                     ellipsoid.texture = textureURLs[textureFileEllipsoid];
//                 } // end for each ellipsoid
                
//                 viewDelta = vec3.length(vec3.subtract(temp,maxCorner,minCorner)) / 100; // set global
//             } // end if ellipsoid file loaded
//         } // end if triangle file loaded
//     } // end try 
    
//     catch(e) {
//         console.log(e);
//     } // end catch
// } // end load models

// // setup the webGL shaders
// function setupShaders() {
    
//     // define vertex shader in essl using es6 template strings
//     var vShaderCode = `
//         attribute vec3 aVertexPosition; // vertex position
//         attribute vec3 aVertexNormal; // vertex normal
        
//         uniform mat4 umMatrix; // the model matrix
//         uniform mat4 upvmMatrix; // the project view model matrix
        
//         varying vec3 vWorldPos; // interpolated world position of vertex
//         varying vec3 vVertexNormal; // interpolated normal for frag shader

//         void main(void) {
            
//             // vertex position
//             vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
//             vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
//             gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

//             // vertex normal (assume no non-uniform scale)
//             vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
//             vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z)); 
//         }
//     `;
    
//     // define fragment shader in essl using es6 template strings
//     var fShaderCode = `
//         precision mediump float; // set float to medium precision

//         // eye location
//         uniform vec3 uEyePosition; // the eye's position in world
        
//         // light properties
//         uniform vec3 uLightAmbient; // the light's ambient color
//         uniform vec3 uLightDiffuse; // the light's diffuse color
//         uniform vec3 uLightSpecular; // the light's specular color
//         uniform vec3 uLightPosition; // the light's position
        
//         // material properties
//         uniform vec3 uAmbient; // the ambient reflectivity
//         uniform vec3 uDiffuse; // the diffuse reflectivity
//         uniform vec3 uSpecular; // the specular reflectivity
//         uniform float uShininess; // the specular exponent
        
//         // geometry properties
//         varying vec3 vWorldPos; // world xyz of fragment
//         varying vec3 vVertexNormal; // normal of fragment
            
//         void main(void) {
        
//             // ambient term
//             vec3 ambient = uAmbient*uLightAmbient; 
            
//             // diffuse term
//             vec3 normal = normalize(vVertexNormal); 
//             vec3 light = normalize(uLightPosition - vWorldPos);
//             float lambert = max(0.0,dot(normal,light));
//             vec3 diffuse = uDiffuse*uLightDiffuse*lambert; // diffuse term
            
//             // specular term
//             vec3 eye = normalize(uEyePosition - vWorldPos);
//             vec3 halfVec = normalize(light+eye);
//             float highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
//             vec3 specular = uSpecular*uLightSpecular*highlight; // specular term
            
//             // combine to output color
//             vec3 colorOut = ambient + diffuse + specular; // no specular yet
//             gl_FragColor = vec4(colorOut, 1.0); 
//         }
//     `;
    
//     try {
//         var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
//         gl.shaderSource(fShader,fShaderCode); // attach code to shader
//         gl.compileShader(fShader); // compile the code for gpu execution

//         var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
//         gl.shaderSource(vShader,vShaderCode); // attach code to shader
//         gl.compileShader(vShader); // compile the code for gpu execution
            
//         if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
//             throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
//             gl.deleteShader(fShader);
//         } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
//             throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
//             gl.deleteShader(vShader);
//         } else { // no compile errors
//             var shaderProgram = gl.createProgram(); // create the single shader program
//             gl.attachShader(shaderProgram, fShader); // put frag shader in program
//             gl.attachShader(shaderProgram, vShader); // put vertex shader in program
//             gl.linkProgram(shaderProgram); // link program into gl context

//             if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
//                 throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
//             } else { // no shader program link errors
//                 gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
//                 // locate and enable vertex attributes
//                 vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
//                 gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
//                 vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // ptr to vertex normal attrib
//                 gl.enableVertexAttribArray(vNormAttribLoc); // connect attrib to array
                
//                 // locate vertex uniforms
//                 mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
//                 pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
                
//                 // locate fragment uniforms
//                 var eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition"); // ptr to eye position
//                 var lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // ptr to light ambient
//                 var lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // ptr to light diffuse
//                 var lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // ptr to light specular
//                 var lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); // ptr to light position
//                 ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // ptr to ambient
//                 diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // ptr to diffuse
//                 specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // ptr to specular
//                 shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // ptr to shininess
                
//                 // pass global constants into fragment uniforms
//                 gl.uniform3fv(eyePositionULoc,Eye); // pass in the eye's position
//                 gl.uniform3fv(lightAmbientULoc,lightAmbient); // pass in the light's ambient emission
//                 gl.uniform3fv(lightDiffuseULoc,lightDiffuse); // pass in the light's diffuse emission
//                 gl.uniform3fv(lightSpecularULoc,lightSpecular); // pass in the light's specular emission
//                 gl.uniform3fv(lightPositionULoc,lightPosition); // pass in the light's position
//             } // end if no shader program link errors
//         } // end if no compile errors
//     } // end try 
    
//     catch(e) {
//         console.log(e);
//     } // end catch
// } // end setup shaders


// let shaderProgram;
// function setupShaders() {
//     // Vertex shader: passes UV coordinates to the fragment shader
//     const vShaderCode = `
//         attribute vec3 aVertexPosition; // vertex position
//         attribute vec2 aTexCoord; // texture coordinates
//         attribute vec3 aVertexNormal;
//         uniform mat4 upvmMatrix; // projection-view-model matrix
//         varying vec3 vNormal; // pass normal to fragment shader
//         varying vec2 vTexCoord; // pass UV to fragment shader

//         void main(void) {
//             gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0); // project position
//             vTexCoord = vec2(1.0 - aTexCoord.x, 1.0 - aTexCoord.y); // pass UV to frag shader (flipped y coordinate)
//             vNormal = aVertexNormal; // pass normal to fragment shader
//         }
//     `;
    
//     // Fragment shader: uses texture UVs to color each fragment
//     const fShaderCode = `
//         precision mediump float;
        
//         uniform sampler2D uTexture; // texture sampler
//         varying vec2 vTexCoord; // interpolated UV from vertex shader
//         varying vec3 vNormal; // interpolated normal from vertex shader

//         uniform vec3 lightDir; // light direction
//         uniform float lightIntensity; // light intensity
//         uniform float blendingMode; // blending mode (0.0 = replace, 1.0 = modulate)



//         void main(void) {
//             vec3 litColor = vec3(0.0); // lit fragment color

//             // calculate diffuse lighting
//             float diffuse = max(0.0, dot(vNormal, lightDir));
//             litColor = vec3(diffuse * lightIntensity);

//             // sample texture
//             vec4 texColor = texture2D(uTexture, vTexCoord);

//             // blend lit color with texture color
//             if (blendingMode == 0.0) { // replace
//                 gl_FragColor = vec4(texColor.rgb, texColor.a);
//             } else if (blendingMode == 1.0) { // modulate
//                 gl_FragColor = vec4(litColor * texColor.rgb, texColor.a);
//             }

//             // enable transparency
//             gl_FragColor.a = texColor.a; // use texture alpha value for transparency
//             gl_FragColor.rgb *= gl_FragColor.a; // multiply RGB by alpha to control transparency
//         }
//     `;
    
//     try {
//         const fShader = gl.createShader(gl.FRAGMENT_SHADER);
//         gl.shaderSource(fShader, fShaderCode);
//         gl.compileShader(fShader);

//         const vShader = gl.createShader(gl.VERTEX_SHADER);
//         gl.shaderSource(vShader, vShaderCode);
//         gl.compileShader(vShader);

//         if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
//             throw "Fragment shader compilation error: " + gl.getShaderInfoLog(fShader);
//         }
//         if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
//             throw "Vertex shader compilation error: " + gl.getShaderInfoLog(vShader);
//         }

//         shaderProgram = gl.createProgram();
//         gl.attachShader(shaderProgram, fShader);
//         gl.attachShader(shaderProgram, vShader);
//         gl.linkProgram(shaderProgram);

//         if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
//             throw "Shader program linking error: " + gl.getProgramInfoLog(shaderProgram);
//         }

//         gl.useProgram(shaderProgram);

//         // Set up attribute locations
//         vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition");
//         gl.enableVertexAttribArray(vPosAttribLoc);

//         vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal");
//         gl.enableVertexAttribArray(vNormAttribLoc);

//         vTexAttribLoc = gl.getAttribLocation(shaderProgram, "aTexCoord");
//         gl.enableVertexAttribArray(vTexAttribLoc);

//         const lightIntensityLoc = gl.getUniformLocation(shaderProgram, "lightIntensity");
//         gl.uniform1f(lightIntensityLoc, 1.0); // Set to desired intensity, e.g., 1.0 for normal intensity   

//         const lightDirLoc = gl.getUniformLocation(shaderProgram, "lightDir");
//         gl.uniform3fv(lightDirLoc, lightPosition); 

//         blendingModeLoc = gl.getUniformLocation(shaderProgram, "blendingMode");

//         // Update blending mode in shader whenever it changes
//         function updateBlendingMode() {
//             gl.uniform1f(blendingModeLoc, blendingMode); // Update the blending mode uniform
//         }

//         function setBlendingMode(mode) {
//             blendingMode = mode; // Set the new blending mode (0 = replace, 1 = modulate)
//             updateBlendingMode(); // Apply the new blending mode to the shader
//         }

//         // Set up uniform locations
//         pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix");
//         textureULoc = gl.getUniformLocation(shaderProgram, "uTexture");

//         // Set texture unit 0 as default for uTexture
//         gl.uniform1i(textureULoc, 0);

//     } catch (e) {
//         console.log(e);
//     }
// }

// // render the loaded model
// function renderModels() {
    
//     // construct the model transform matrix, based on model state
//     function makeModelTransform(currModel) {
//         var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCtr = vec3.create();

//         // move the model to the origin
//         mat4.fromTranslation(mMatrix,vec3.negate(negCtr,currModel.center)); 
        
//         // scale for highlighting if needed
//         if (currModel.on)
//             mat4.multiply(mMatrix,mat4.fromScaling(temp,vec3.fromValues(1.2,1.2,1.2)),mMatrix); // S(1.2) * T(-ctr)
        
//         // rotate the model to current interactive orientation
//         vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis)); // get the new model z axis
//         mat4.set(sumRotation, // get the composite rotation
//             currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
//             currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
//             currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
//             0, 0,  0, 1);
//         mat4.multiply(mMatrix,sumRotation,mMatrix); // R(ax) * S(1.2) * T(-ctr)
        
//         // translate back to model center
//         mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.center),mMatrix); // T(ctr) * R(ax) * S(1.2) * T(-ctr)

//         // translate model to current interactive orientation
//         mat4.multiply(mMatrix,mat4.fromTranslation(temp,currModel.translation),mMatrix); // T(pos)*T(ctr)*R(ax)*S(1.2)*T(-ctr)
        
//     } // end make model transform
    
//     // var hMatrix = mat4.create(); // handedness matrix
//     var pMatrix = mat4.create(); // projection matrix
//     var vMatrix = mat4.create(); // view matrix
//     var mMatrix = mat4.create(); // model matrix
//     var pvMatrix = mat4.create(); // hand * proj * view matrices
//     var pvmMatrix = mat4.create(); // hand * proj * view * model matrices
    
//     window.requestAnimationFrame(renderModels); // set up frame render callback
    
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
//     // set up projection and view
//     // mat4.fromScaling(hMatrix,vec3.fromValues(-1,1,1)); // create handedness matrix
//     mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,10); // create projection matrix
//     mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
//     mat4.multiply(pvMatrix,pvMatrix,pMatrix); // projection
//     mat4.multiply(pvMatrix,pvMatrix,vMatrix); // projection * view

//     gl.enable(gl.BLEND);
//     gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 
//     // render each triangle set
//     var currSet; // the tri set and its material properties
//     for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
//         currSet = inputTriangles[whichTriSet];
        
//         // make model transform, add to view project
//         makeModelTransform(currSet);
//         mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // project * view * model
//         gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
//         gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in the hpvm matrix

//         // Bind the texture specific to this triangle set
//         gl.activeTexture(gl.TEXTURE0);
//         gl.bindTexture(gl.TEXTURE_2D, currSet.texture);

//         // Set up texture coordinates buffer
//         gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffers[whichTriSet]);
//         gl.vertexAttribPointer(vTexAttribLoc, 2, gl.FLOAT, false, 0, 0);
//         gl.enableVertexAttribArray(vTexAttribLoc);
        
//         // reflectivity: feed to the fragment shader
//         gl.uniform3fv(ambientULoc,currSet.material.ambient); // pass in the ambient reflectivity
//         gl.uniform3fv(diffuseULoc,currSet.material.diffuse); // pass in the diffuse reflectivity
//         gl.uniform3fv(specularULoc,currSet.material.specular); // pass in the specular reflectivity
//         gl.uniform1f(shininessULoc,currSet.material.n); // pass in the specular exponent
        
//         // vertex buffer: activate and feed into vertex shader
//         gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[whichTriSet]); // activate
//         gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
//         gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[whichTriSet]); // activate
//         gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed

//         // triangle buffer: activate and render
//         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[whichTriSet]); // activate
//         gl.drawElements(gl.TRIANGLES,3*triSetSizes[whichTriSet],gl.UNSIGNED_SHORT,0); // render
        
//     } // end for each triangle set
    
//     // render each ellipsoid
//     var ellipsoid, instanceTransform = mat4.create(); // the current ellipsoid and material
    
//     for (var whichEllipsoid=0; whichEllipsoid<numEllipsoids; whichEllipsoid++) {
//         ellipsoid = inputEllipsoids[whichEllipsoid];
        
//         // define model transform, premult with pvmMatrix, feed to vertex shader
//         makeModelTransform(ellipsoid);
//         pvmMatrix = mat4.multiply(pvmMatrix,pvMatrix,mMatrix); // premultiply with pv matrix
//         gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in model matrix
//         gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix); // pass in project view model matrix

//         // reflectivity: feed to the fragment shader
//         gl.uniform3fv(ambientULoc,ellipsoid.ambient); // pass in the ambient reflectivity
//         gl.uniform3fv(diffuseULoc,ellipsoid.diffuse); // pass in the diffuse reflectivity
//         gl.uniform3fv(specularULoc,ellipsoid.specular); // pass in the specular reflectivity
//         gl.uniform1f(shininessULoc,ellipsoid.n); // pass in the specular exponent

//         // Bind the texture specific to this triangle set
//         gl.activeTexture(gl.TEXTURE0);
//         gl.bindTexture(gl.TEXTURE_2D, ellipsoid.texture);

//         // Set up texture coordinates buffer
//         gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffers[whichEllipsoid]);
//         gl.vertexAttribPointer(vTexAttribLoc, 2, gl.FLOAT, false, 0, 0);

//         gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[numTriangleSets+whichEllipsoid]); // activate vertex buffer
//         gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed vertex buffer to shader
//         gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[numTriangleSets+whichEllipsoid]); // activate normal buffer
//         gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed normal buffer to shader
//         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[numTriangleSets+whichEllipsoid]); // activate tri buffer
        
//         // draw a transformed instance of the ellipsoid
//         gl.drawElements(gl.TRIANGLES,triSetSizes[numTriangleSets+whichEllipsoid],gl.UNSIGNED_SHORT,0); // render
//     } // end for each ellipsoid
// } // end render model