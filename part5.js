/* GLOBAL CONSTANTS AND VARIABLES */



/* assignment specific globals */
const INPUT_TRIANGLES_URL = "https://skandasshastry.github.io/part5.json"; // triangles file loc
const prefix = "./";
var defaultEye = vec3.fromValues(0.5,0.5,-0.5); // default eye position in world space
var defaultCenter = vec3.fromValues(0.5,0.5,0.5); // default view direction in world space
var defaultUp = vec3.fromValues(0,1,0); // default view up vector
var lightAmbient = vec3.fromValues(1,1,1); // default light ambient emission
var lightDiffuse = vec3.fromValues(1,1,1); // default light diffuse emission
var lightSpecular = vec3.fromValues(1,1,1); // default light specular emission
var lightPosition = vec3.fromValues(-0.5,1.5,-0.5); // default light position
var rotateTheta = Math.PI/50; // how much to rotate models by with each key press

var uvBuffers = [];
var shaderProgram;
var vTexCoordAttribLoc; // for UV coordinates attribute location

/* webgl and geometry data */
var gl = null; // the all powerful gl object. It's all here folks!
var inputTriangles = []; // the triangle data as loaded from input files
var numTriangleSets = 0; // how many triangle sets in input scene
var inputEllipsoids = []; // the ellipsoid data as loaded from input files
var numEllipsoids = 0; // how many ellipsoids in the input scene
var vertexBuffers = []; // this contains vertex coordinate lists by set, in triples
var normalBuffers = []; // this contains normal component lists by set, in triples
var triSetSizes = []; // this contains the size of each triangle set
var triangleBuffers = []; // lists of indices into vertexBuffers by set, in triples
var viewDelta = 0; // how much to displace view with each key press

/* shader parameter locations */
var vPosAttribLoc; // where to put position for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc; // where to put project model view matrix for vertex shader
var ambientULoc; // where to put ambient reflecivity for fragment shader
var diffuseULoc; // where to put diffuse reflecivity for fragment shader
var specularULoc; // where to put specular reflecivity for fragment shader
var shininessULoc; // where to put specular exponent for fragment shader

/* interaction variables */
var Eye = vec3.clone(defaultEye); // eye position in world space
var Center = vec3.clone(defaultCenter); // view direction in world space
var Up = vec3.clone(defaultUp); // view up vector in world space
// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input json file

// does stuff when keys are pressed
// function handleKeyDown(event) {
    
//     const modelEnum = {TRIANGLES: "triangles", ELLIPSOID: "ellipsoid"}; // enumerated model type
//     const dirEnum = {NEGATIVE: -1, POSITIVE: 1}; // enumerated rotation direction
    
//     function highlightModel(modelType,whichModel) {
//         if (handleKeyDown.modelOn != null)
//             handleKeyDown.modelOn.on = false;
//         handleKeyDown.whichOn = whichModel;
//         if (modelType == modelEnum.TRIANGLES)
//             handleKeyDown.modelOn = inputTriangles[whichModel]; 
//         else
//             handleKeyDown.modelOn = inputEllipsoids[whichModel]; 
//         handleKeyDown.modelOn.on = true; 
//     } // end highlight model
    
//     function translateModel(offset) {
//         if (handleKeyDown.modelOn != null)
//             vec3.add(handleKeyDown.modelOn.translation,handleKeyDown.modelOn.translation,offset);
//     } // end translate model

//     function rotateModel(axis,direction) {
//         if (handleKeyDown.modelOn != null) {
//             var newRotation = mat4.create();

//             mat4.fromRotation(newRotation,direction*rotateTheta,axis); // get a rotation matrix around passed axis
//             vec3.transformMat4(handleKeyDown.modelOn.xAxis,handleKeyDown.modelOn.xAxis,newRotation); // rotate model x axis tip
//             vec3.transformMat4(handleKeyDown.modelOn.yAxis,handleKeyDown.modelOn.yAxis,newRotation); // rotate model y axis tip
//         } // end if there is a highlighted model
//     } // end rotate model
    
//     // set up needed view params
//     var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create(); // lookat, right & temp vectors
//     lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye)); // get lookat vector
//     viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up)); // get view right vector
    
//     // highlight static variables
//     handleKeyDown.whichOn = handleKeyDown.whichOn == undefined ? -1 : handleKeyDown.whichOn; // nothing selected initially
//     handleKeyDown.modelOn = handleKeyDown.modelOn == undefined ? null : handleKeyDown.modelOn; // nothing selected initially

//     var blendingMode = 0.0; // initial blending modeb

//     switch (event.code) {
        
//         // model selection
//         case "Space": 
//             if (handleKeyDown.modelOn != null)
//                 handleKeyDown.modelOn.on = false; // turn off highlighted model
//             handleKeyDown.modelOn = null; // no highlighted model
//             handleKeyDown.whichOn = -1; // nothing highlighted
//             break;
//         case "ArrowRight": // select next triangle set
//             highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn+1) % numTriangleSets);
//             break;
//         case "ArrowLeft": // select previous triangle set
//             highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : numTriangleSets-1);
//             break;
//         case "ArrowUp": // select next ellipsoid
//             highlightModel(modelEnum.ELLIPSOID,(handleKeyDown.whichOn+1) % numEllipsoids);
//             break;
//         case "ArrowDown": // select previous ellipsoid
//             highlightModel(modelEnum.ELLIPSOID,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : numEllipsoids-1);
//             break;
            
//         // view change
//         case "KeyA": // translate view left, rotate left with shift
//             Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,viewDelta));
//             if (!event.getModifierState("Shift"))
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,viewDelta));
//             break;
//         case "KeyD": // translate view right, rotate right with shift
//             Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,-viewDelta));
//             if (!event.getModifierState("Shift"))
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,-viewDelta));
//             break;
//         case "KeyS": // translate view backward, rotate up with shift
//             if (event.getModifierState("Shift")) {
//                 Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
//                 Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
//             } else {
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,-viewDelta));
//                 Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,-viewDelta));
//             } // end if shift not pressed
//             break;
//         case "KeyW": // translate view forward, rotate down with shift
//             if (event.getModifierState("Shift")) {
//                 Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
//                 Up = vec3.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
//             } else {
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,viewDelta));
//                 Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,viewDelta));
//             } // end if shift not pressed
//             break;
//         case "KeyQ": // translate view up, rotate counterclockwise with shift
//             if (event.getModifierState("Shift"))
//                 Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,-viewDelta)));
//             else {
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,viewDelta));
//                 Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
//             } // end if shift not pressed
//             break;
//         case "KeyE": // translate view down, rotate clockwise with shift
//             if (event.getModifierState("Shift"))
//                 Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,viewDelta)));
//             else {
//                 Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,-viewDelta));
//                 Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
//             } // end if shift not pressed
//             break;
//         case "Escape": // reset view to default
//             Eye = vec3.copy(Eye,defaultEye);
//             Center = vec3.copy(Center,defaultCenter);
//             Up = vec3.copy(Up,defaultUp);
//             break;
            
//         // model transformation
//         case "KeyK": // translate left, rotate left with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(Up,dirEnum.NEGATIVE);
//             else
//                 translateModel(vec3.scale(temp,viewRight,viewDelta));
//             break;
//         case "Semicolon": // translate right, rotate right with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(Up,dirEnum.POSITIVE);
//             else
//                 translateModel(vec3.scale(temp,viewRight,-viewDelta));
//             break;
//         case "KeyL": // translate backward, rotate up with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(viewRight,dirEnum.POSITIVE);
//             else
//                 translateModel(vec3.scale(temp,lookAt,-viewDelta));
//             break;
//         case "KeyO": // translate forward, rotate down with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(viewRight,dirEnum.NEGATIVE);
//             else
//                 translateModel(vec3.scale(temp,lookAt,viewDelta));
//             break;
//         case "KeyI": // translate up, rotate counterclockwise with shift 
//             if (event.getModifierState("Shift"))
//                 rotateModel(lookAt,dirEnum.POSITIVE);
//             else
//                 translateModel(vec3.scale(temp,Up,viewDelta));
//             break;
//         case "KeyP": // translate down, rotate clockwise with shift
//             if (event.getModifierState("Shift"))
//                 rotateModel(lookAt,dirEnum.NEGATIVE);
//             else
//                 translateModel(vec3.scale(temp,Up,-viewDelta));
//             break;
//         case "Backspace": // reset model transforms to default
//             for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
//                 vec3.set(inputTriangles[whichTriSet].translation,0,0,0);
//                 vec3.set(inputTriangles[whichTriSet].xAxis,1,0,0);
//                 vec3.set(inputTriangles[whichTriSet].yAxis,0,1,0);
//             } // end for all triangle sets
//             for (var whichEllipsoid=0; whichEllipsoid<numEllipsoids; whichEllipsoid++) {
//                 vec3.set(inputEllipsoids[whichEllipsoid].translation,0,0,0);
//                 vec3.set(inputEllipsoids[whichTriSet].xAxis,1,0,0);
//                 vec3.set(inputEllipsoids[whichTriSet].yAxis,0,1,0);
//             } // end for all ellipsoids
//             break;
//         case "KeyB":
//             console.log("Before toggle:", blendingMode);
//             blendingMode = blendingMode === 0.0 ? 1.0 : 0.0;
//             console.log("After toggle:", blendingMode);
//             gl.uniform1f(blendingModeLoc, blendingMode);
//             console.log(blendingMode);
//     } // end switch
// } // end handleKeyDown

// set up the webGL environment
function setupWebGL() {
    
    // Set up keys
    // document.onkeydown = handleKeyDown; // commented as we don't need to handle key events 


    var imageCanvas = document.getElementById("myImageCanvas"); // create a 2d canvas
      var cw = imageCanvas.width, ch = imageCanvas.height; 
      imageContext = imageCanvas.getContext("2d"); 
      var bkgdImage = new Image(); 
      bkgdImage.crossOrigin = "Anonymous";
      bkgdImage.src = "./background.jpg";
      bkgdImage.onload = function(){
          var iw = bkgdImage.width, ih = bkgdImage.height;
          imageContext.drawImage(bkgdImage,0,0,iw,ih,0,0,cw,ch);   
     }

     
    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        //gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

var textureBuffers = [];
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Put a single pixel as temporary texture
    const pixel = new Uint8Array([255, 0, 255, 255]);  // magenta
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    // Load the actual texture
    const image = new Image();
    image.crossOrigin = "anonymous";  // Important for CORS
    
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  // Flip Y coordinate
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Check if dimensions are powers of 2
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        
        // Force a re-render after texture loads
        renderModels();
    };
    
    image.onerror = function() {
        console.error("Error loading texture:", url);
    };

    // Prepend the prefix to the URL if it's not already an absolute URL
    const fullUrl = url.startsWith('http') ? url : prefix + url;
    image.src = fullUrl;
    
    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function checkTextureLoading() {
    inputTriangles.forEach((triSet, index) => {
        console.log(`Triangle set ${index} texture URL:`, triSet.material.texture);
    });
}

function loadModels() {
    inputTriangles = getJSONFile(INPUT_TRIANGLES_URL, "triangles");

    try {
        if (inputTriangles == String.null)
            throw "Unable to load triangles file!";
        
        var maxCorner = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
        var minCorner = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        
        numTriangleSets = inputTriangles.length;
        // console.log("Loading", numTriangleSets, "triangle sets");
        
        for (let whichSet = 0; whichSet < numTriangleSets; whichSet++) {
            const currSet = inputTriangles[whichSet];
            // console.log("Processing triangle set", whichSet);

            // Set up modeling translation and rotation
            currSet.center = vec3.fromValues(0, 0, 0);
            currSet.on = false;
            currSet.translation = vec3.fromValues(0, 0, 0);
            currSet.xAxis = vec3.fromValues(1, 0, 0);
            currSet.yAxis = vec3.fromValues(0, 1, 0);

            // Process vertices
            currSet.glVertices = [];
            currSet.glNormals = [];
            currSet.glUVs = [];
            const numVerts = currSet.vertices.length;
            
            // console.log("Processing", numVerts, "vertices for set", whichSet);

            for (let whichSetVert = 0; whichSetVert < numVerts; whichSetVert++) {
                const vtxToAdd = currSet.vertices[whichSetVert];
                const normToAdd = currSet.normals[whichSetVert];
                const uvToAdd = currSet.uvs[whichSetVert];

                // Add vertex coordinates
                currSet.glVertices.push(vtxToAdd[0], vtxToAdd[1], vtxToAdd[2]);
                
                // Add normal coordinates
                currSet.glNormals.push(normToAdd[0], normToAdd[1], normToAdd[2]);
                
                // Add UV coordinates
                currSet.glUVs.push(uvToAdd[0], uvToAdd[1]);

                // Update bounding box
                vec3.max(maxCorner, maxCorner, vtxToAdd);
                vec3.min(minCorner, minCorner, vtxToAdd);
                vec3.add(currSet.center, currSet.center, vtxToAdd);
            }

            vec3.scale(currSet.center, currSet.center, 1 / numVerts);

            // Send vertex coordinates to WebGL
            vertexBuffers[whichSet] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[whichSet]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(currSet.glVertices), gl.STATIC_DRAW);

            // Send normal coordinates to WebGL
            normalBuffers[whichSet] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[whichSet]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(currSet.glNormals), gl.STATIC_DRAW);

            // Send UV coordinates to WebGL
            uvBuffers[whichSet] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffers[whichSet]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(currSet.glUVs), gl.STATIC_DRAW);

            // Set up triangle indices
            currSet.glTriangles = [];
            triSetSizes[whichSet] = currSet.triangles.length;
            
            // console.log("Processing", triSetSizes[whichSet], "triangles for set", whichSet);

            for (let whichSetTri = 0; whichSetTri < triSetSizes[whichSet]; whichSetTri++) {
                const triToAdd = currSet.triangles[whichSetTri];
                currSet.glTriangles.push(triToAdd[0], triToAdd[1], triToAdd[2]);
            }

            // Send triangle indices to WebGL
            triangleBuffers[whichSet] = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(currSet.glTriangles), gl.STATIC_DRAW);

            // Load and setup texture
            const textureUrl = currSet.material.texture;
            // console.log("Loading texture for set", whichSet, ":", textureUrl);
            textureBuffers[whichSet] = loadTexture(gl, textureUrl);
        }

        viewDelta = vec3.length(vec3.subtract(vec3.create(), maxCorner, minCorner)) / 100;
        // console.log("Model loading complete");
        
    } catch (e) {
        console.log("Error loading models:", e);
    }
}

function setupShaders() {
    // Vertex shader code with lighting
    var vShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        attribute vec2 aTexCoord;       // texture coordinates
        attribute vec3 aVertexNormal;   // vertex normal
        
        varying vec2 vTexCoord;         // pass UV to fragment shader
        varying vec3 vNormal;           // pass normal to fragment shader
        varying vec3 vFragPos;          // pass fragment position to fragment shader
        
        uniform mat4 umMatrix;          // model matrix
        uniform mat4 upvmMatrix;        // project view model matrix
        
        void main(void) {
            vFragPos = vec3(umMatrix * vec4(aVertexPosition, 1.0)); // Calculate fragment position
            vNormal = mat3(umMatrix) * aVertexNormal;               // Transform normal
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);
            vTexCoord = aTexCoord;      // pass UV to fragment shader
        }
    `;

    // Fragment shader code with lighting
    const fShaderCode = `
    precision mediump float;
    
    varying vec2 vTexCoord;
    varying vec3 vNormal;
    varying vec3 vFragPos;
    
    uniform sampler2D uSampler;
    
    uniform vec3 lightPosition;
    uniform vec3 lightAmbient;
    uniform vec3 lightDiffuse;
    uniform vec3 lightSpecular;
    
    uniform vec3 materialAmbient;
    uniform vec3 materialDiffuse;
    uniform vec3 materialSpecular;
    uniform float materialShininess;
    uniform float materialAlpha;
    
    void main(void) {
        // Sample the texture
        vec4 texColor = texture2D(uSampler, vTexCoord);
        
        // Calculate lighting
        vec3 norm = normalize(vNormal);
        vec3 lightDir = normalize(lightPosition - vFragPos);
        
        // Ambient
        vec3 ambient = lightAmbient * materialAmbient;
        
        // Diffuse
        float diff = max(dot(norm, lightDir), 0.0);
        vec3 diffuse = lightDiffuse * (diff * materialDiffuse);
        
        // Specular
        vec3 viewDir = normalize(vec3(0,0,0) - vFragPos);
        vec3 reflectDir = reflect(-lightDir, norm);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), materialShininess);
        vec3 specular = lightSpecular * (spec * materialSpecular);
        
        // Combine lighting with texture
        vec3 result = (ambient + diffuse + specular) * texColor.rgb;
        
        // Final color with alpha
        gl_FragColor = vec4(result, texColor.a * materialAlpha);
    }
`;
    try {
        // Compile the vertex shader
        var vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, vShaderCode);
        gl.compileShader(vShader);
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            throw "Error during vertex shader compile: " + gl.getShaderInfoLog(vShader);
        }

        // Compile the fragment shader
        var fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, fShaderCode);
        gl.compileShader(fShader);
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            throw "Error during fragment shader compile: " + gl.getShaderInfoLog(fShader);
        }

        // Link shaders into a program
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vShader);
        gl.attachShader(shaderProgram, fShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw "Error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
        }

        // Use the shader program
        gl.useProgram(shaderProgram);

        // Get attribute locations
        vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        vTexCoordAttribLoc = gl.getAttribLocation(shaderProgram, "aTexCoord");

        // Enable vertex attributes
        gl.enableVertexAttribArray(vPosAttribLoc);
        gl.enableVertexAttribArray(vNormAttribLoc);
        gl.enableVertexAttribArray(vTexCoordAttribLoc);

        // Get uniform locations
        mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix");
        pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix");

        // Set up lighting uniforms
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightPosition"), lightPosition);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightAmbient"), lightAmbient);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightDiffuse"), lightDiffuse);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightSpecular"), lightSpecular);

        // Set up texture sampler
        var uSamplerLoc = gl.getUniformLocation(shaderProgram, "uSampler");
        gl.uniform1i(uSamplerLoc, 0);

    } catch (e) {
        console.log(e);
    }
}

function renderModels() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up matrices
    var viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, Eye, Center, Up);
    
    var projMatrix = mat4.create();
    mat4.perspective(projMatrix, Math.PI/2, 1, 0.1, 10);
    
    var pvMatrix = mat4.create();
    mat4.multiply(pvMatrix, projMatrix, viewMatrix);

    // Sort objects by transparency
    const opaqueObjects = [];
    const transparentObjects = [];
    
    for (let i = 0; i < numTriangleSets; i++) {
        const currSet = inputTriangles[i];
        currSet.index = i;
        
        if (currSet.material.alpha >= 1.0) {
            opaqueObjects.push(currSet);
        } else {
            transparentObjects.push(currSet);
        }
    }

    // Sort transparent objects back-to-front
    transparentObjects.sort((a, b) => {
        const distA = vec3.squaredDistance(Eye, a.center);
        const distB = vec3.squaredDistance(Eye, b.center);
        return distB - distA;
    });

    // Render opaque objects first
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    renderObjectSet(opaqueObjects, pvMatrix);

    // Then render transparent objects
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    renderObjectSet(transparentObjects, pvMatrix);

    // Reset state
    gl.disable(gl.BLEND);
    gl.depthMask(true);
}

function renderObjectSet(objects, pvMatrix) {
    objects.forEach(currSet => {
        const whichSet = currSet.index;
        
        // Bind shader program if not already bound
        gl.useProgram(shaderProgram);
        
        // Set up matrices
        var modelMatrix = mat4.create();
        makeModelTransform(currSet);
        mat4.copy(modelMatrix, mMatrix);
        
        var pvmMatrix = mat4.create();
        mat4.multiply(pvmMatrix, pvMatrix, modelMatrix);
        
        // Update uniforms
        gl.uniformMatrix4fv(mMatrixULoc, false, modelMatrix);
        gl.uniformMatrix4fv(pvmMatrixULoc, false, pvmMatrix);
        
        // Material properties
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "materialAmbient"), currSet.material.ambient);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "materialDiffuse"), currSet.material.diffuse);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "materialSpecular"), currSet.material.specular);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "materialShininess"), currSet.material.n);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "materialAlpha"), currSet.material.alpha);
        
        // Bind vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[whichSet]);
        gl.vertexAttribPointer(vPosAttribLoc, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[whichSet]);
        gl.vertexAttribPointer(vNormAttribLoc, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffers[whichSet]);
        gl.vertexAttribPointer(vTexCoordAttribLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureBuffers[whichSet]);
        
        // Draw triangles
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[whichSet]);
        gl.drawElements(gl.TRIANGLES, triSetSizes[whichSet] * 3, gl.UNSIGNED_SHORT, 0);
    });
}

function makeModelTransform(currSet) {
    // Create the model transform matrix from translation, rotation
    var zAxis = vec3.create();
    var rotationMatrix = mat4.create();
    
    vec3.cross(zAxis, currSet.xAxis, currSet.yAxis);
    vec3.normalize(zAxis, zAxis);
    
    rotationMatrix[0] = currSet.xAxis[0];
    rotationMatrix[1] = currSet.xAxis[1];
    rotationMatrix[2] = currSet.xAxis[2];
    rotationMatrix[3] = 0.0;
    rotationMatrix[4] = currSet.yAxis[0];
    rotationMatrix[5] = currSet.yAxis[1];
    rotationMatrix[6] = currSet.yAxis[2];
    rotationMatrix[7] = 0.0;
    rotationMatrix[8] = zAxis[0];
    rotationMatrix[9] = zAxis[1];
    rotationMatrix[10] = zAxis[2];
    rotationMatrix[11] = 0.0;
    rotationMatrix[12] = currSet.translation[0];
    rotationMatrix[13] = currSet.translation[1];
    rotationMatrix[14] = currSet.translation[2];
    rotationMatrix[15] = 1.0;
    
    mMatrix = rotationMatrix;
}

/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadModels(); // load in the models from tri file
  setupShaders(); // setup the webGL shaders
  renderModels(); // draw the triangles using webGL
  
} // end main
