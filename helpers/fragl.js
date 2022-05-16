// UNIFORMS
function uniform(name, suffix, gl, program) {
  const location = gl.getUniformLocation( program, name );

  const setter = (values) => {
    var method = 'uniform' + suffix;
    var args = [ location ].concat( values );
    gl[ method ].apply( gl, args );
  }

  return { setter, location };
}

function uniformFactory(gl, program) {
  const uniforms = {};

  function createUniform(name, suffix) {
    uniforms[name] = uniform(name, suffix, gl, program);

    return uniforms[name].location;
  }

  function setUniform(name, values) {
    uniforms[name].setter(values);
  }

  function getUniform(name) {
    return uniforms[name].location;
  }

  return { createUniform, setUniform, getUniform }
}

// PROGRAMS
function addProgram(gl, vertexShaderSource, fragmentShaderSource) {
  // create program
  var program = gl.createProgram();

  const addShader = ( source, type ) => {
    var shader = gl.createShader( type );
    gl.shaderSource( shader, source );
    gl.compileShader( shader );
    var isCompiled = gl.getShaderParameter( shader, gl.COMPILE_STATUS );
    if ( !isCompiled ) {
      throw new Error( 'Shader compile error: ' + gl.getShaderInfoLog( shader ) );
    }
    gl.attachShader( program, shader );
  }

  // add shaders
  addShader( vertexShaderSource, gl.VERTEX_SHADER );
  addShader( fragmentShaderSource, gl.FRAGMENT_SHADER );

  // link & use program
  gl.linkProgram( program );
  gl.useProgram( program );

  return program;
}

const createFunction = (canvas) => (data) => {
  const gl = canvas.getContext('webgl2');
  let vert = data.vert;
  if (!vert) {
    vert = `#version 300 es
       
      // an attribute is an input (in) to a vertex shader.
      // It will receive data from a buffer
      in vec4 position;
       
      // all shaders have a main function
      void main() {
       
        // gl_Position is a special variable a vertex shader
        // is responsible for setting
        gl_Position = position;
      }
    `
  }

  const frag = data.frag;

  // --- init WebGL ---
  // console.time("add");
  const program = addProgram(gl, vert, frag);
  // console.timeEnd("add");

  // --- create uniforms ---
  const uniforms = uniformFactory(gl, program);
  const textures = []; // hate this indexing method

  // count for alternating framebuffers
  let count = 0;
  let fbs;
  if (data.useLast) {
    fbs = createFramebuffer(canvas);
    textures.push("0");
    textures.push("1");
    uniforms.createUniform( data.useLast, "1i" );
  }


  // other uniforms
  for ( const entry of data.uniforms) {
    const [ name, type ] = entry;
    uniforms.createUniform( name, type === "tex" ? "1i" : type );

    if (type === "tex") textures.push(name); // hate this indexing method
  }

  // --- set up geometry ---
  const verts = [
     1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0,
  ];

  const position = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, position );
  gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW );
  var positionLocation = gl.getAttribLocation( program, 'position' );
  gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( positionLocation );

  return (uniformValues, draw = true) => {
    gl.useProgram( program );
    gl.viewport(0, 0, canvas.width, canvas.height); // often not necessary unless canvas changed

    // gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    
    // set uniforms
    for (const name in uniformValues) {
      let value = uniformValues[name];

      // set uniform textures
      if (value instanceof WebGLTexture) {
        const i = textures.indexOf(name);
        gl.activeTexture(gl.TEXTURE0 + i); 
        gl.bindTexture(gl.TEXTURE_2D, value);
        const location = uniforms.getUniform(name);
        gl.uniform1i(location, i);
      } else {
        uniforms.setUniform( name, value );
      };
    }

    // non-rendered execution and last state
    if (data.useLast) {

      const fbIndex = count % 2;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[fbIndex][0]);
      const i = textures.indexOf(`${fbIndex === 0 ? 1 : 0}`);
      gl.activeTexture(gl.TEXTURE0 + i);
      const location = uniforms.getUniform(data.useLast)
      gl.uniform1i(location, i);
      gl.bindTexture(gl.TEXTURE_2D, fbs[i][1]);

      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

      count++;

    }

    if (draw) {
      if (data.useLast) gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }

  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

const createTexture = (canvas) => (data, width, height) => {
  const gl = canvas.getContext('webgl2');

  if (!width) width = canvas.width;
  if (!height) height = canvas.height;

  const numChannels = data.length/(width*height);

  if (![1,2,3,4].includes(numChannels)) 
    throw `Can only have 1-4 channels. Not ${numChannels}`

  const dataType = data.constructor.name;

  const dataTypesChannels = { // could add Uint16 and Uint32
    "Float32Array,1": {
      internalFormat: gl.R32F,
      srcFormat: gl.RED,
      srcType: gl.FLOAT
    },
    "Float32Array,2": {
      internalFormat: gl.RG32F,
      srcFormat: gl.RG,
      srcType: gl.FLOAT
    },
    "Float32Array,3": {
      internalFormat: gl.RGB32F,
      srcFormat: gl.RGB,
      srcType: gl.FLOAT
    },
    "Float32Array,4": {
      internalFormat: gl.RGBA32F,
      srcFormat: gl.RGBA,
      srcType: gl.FLOAT
    },
    "Uint8ClampedArray,1": {
      internalFormat: gl.R8,
      srcFormat: gl.RED,
      srcType: gl.UNSIGNED_BYTE
    },
    "Uint8ClampedArray,2": {
      internalFormat: gl.RG8,
      srcFormat: gl.RG,
      srcType: gl.UNSIGNED_BYTE
    },
    "Uint8ClampedArray,3": {
      internalFormat: gl.RGB8,
      srcFormat: gl.RGB,
      srcType: gl.UNSIGNED_BYTE
    },
    "Uint8ClampedArray,4": {
      internalFormat: gl.RGBA8,
      srcFormat: gl.RGBA,
      srcType: gl.UNSIGNED_BYTE
    }
  }

  const key = `${dataType},${numChannels}`;
  console.log(key);

  if (!(key in dataTypesChannels))
    throw `Unknown key: ${key}`

  const { internalFormat, srcFormat, srcType } = dataTypesChannels[key];

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(
    gl.TEXTURE_2D, 
    0, // level 
    internalFormat, 
    width, 
    height, 
    0,
    srcFormat,
    srcType, 
    data
  );

  // gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  // if (isPowerOf2(width) && isPowerOf2(height)) {
  //    // Yes, it's a power of 2. Generate mips.
  //    gl.generateMipmap(gl.TEXTURE_2D);
  // } else {
  //    // No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
  //    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  //    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  //    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // }

  return texture;
}

const createFramebuffer = (canvas) => {
  const gl = canvas.getContext('webgl2');
  const tex0 = createTexture(canvas)(new Uint8ClampedArray(canvas.width*canvas.height*4));
  const tex1 = createTexture(canvas)(new Uint8ClampedArray(canvas.width*canvas.height*4));

  const fb0 = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex0, 0);

  const fb1 = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex1, 0);


  return [[fb0, tex0], [fb1, tex1]];
}

export const fragl = (canvas) => {
  return {
    createFunction: createFunction(canvas),
    createTexture: createTexture(canvas),
  }
}















