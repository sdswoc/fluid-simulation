'use strict';

const canvas =document.getElementsByTagName('canvas')[0];
canvas.width =canvas.clientWidth;
canvas.height=canvas.clientHeight;



let config ={
TEXTURE_DOWNSAMPLE: 1,
DENSITY_DISSIPATION: 0.99,
VELOCITY_DISSIPATION: 0.99,
PRESSURE_DISSIPATION: 0.75,
PRESSURE_ITERATIONS: 25,
CURL: 40,
SPLAT_RADIUS:0.008,
SUNRAYS: true,
SUNRAYS_RESOLUTION: 200,
SUNRAYS_WEIGHT: 1.0

};




let pointers = [];
let splatStack =[];



const { gl, ext } = getWebGLContext(canvas);

function getWebGLContext(canvas){
    const params = { alpha: false, depth: false, stencil: false, antialias: false};




    let gl =canvas.getContext('webgl2' , params);
    const  isWebGL2 = !!gl;

    if(!WebGL2)
    gl = canvas.getContext('webgl' , 'params') || canvas.getContext('experimental-webgl' , 'params');
    
    let halffloat;
    let supportLinearFiltering;
    if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
      } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
      }
    
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
      const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
      let formatRGBA;
      let formatRG;
      let formatR;
    
      if (isWebGL2)
      {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
      } else
    
      {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      }
    
      return {
        gl,
        ext: {
          formatRGBA,
          formatRG,
          formatR,
          halfFloatTexType,
          supportLinearFiltering } };
    
    
    }
    
    function getSupportedFormat(gl, internalFormat, format, type)
    {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type))
      {
        switch (internalFormat) {
    
          case gl.R16F:
            return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
          case gl.RG16F:
            return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
          default:
            return null;}
    
      }
    
      return {
        internalFormat,
        format }; 
    
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      
        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status != gl.FRAMEBUFFER_COMPLETE)
        return false;
        return true;
      }
      
      function pointerPrototype() {
        this.id = -1;
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.down = false;
        this.moved = false;
        this.color = [30, 0, 300];
      }
      
      pointers.push(new pointerPrototype());
      class GLProgram {
        constructor(vertexShader, fragmentShader) {
          this.uniforms = {};
          this.program = gl.createProgram();
      
          gl.attachShader(this.program, vertexShader);
          gl.attachShader(this.program, fragmentShader);
          gl.linkProgram(this.program);
      
          if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
          throw gl.getProgramInfoLog(this.program);
      
          const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
          for (let i = 0; i < uniformCount; i++) {
            const uniformName = gl.getActiveUniform(this.program, i).name;
            this.uniforms[uniformName] = gl.getUniformLocation(this.program, uniformName);
          }
        }
      
        bind() {
          gl.useProgram(this.program);
        }}
      
      
      function compileShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
      
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw gl.getShaderInfoLog(shader);
      
        return shader;
      };
      const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
      precision highp float;
      precision mediump sampler2D;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
      }
  `);

  const clearShader = compileShader(gl.FRAGMENT_SHADER, `
  precision highp float;
  precision mediump sampler2D;

  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
      gl_FragColor = value * texture2D(uTexture, vUv);
  }
`);

const displayShader = compileShader(gl.FRAGMENT_SHADER, `
  precision highp float;
  precision mediump sampler2D;

  varying vec2 vUv;
  uniform sampler2D uTexture;

  void main () {
      gl_FragColor = texture2D(uTexture, vUv);
  }
`);

const splatShader = compileShader(gl.FRAGMENT_SHADER, `
  precision highp float;
  precision mediump sampler2D;

  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main () {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture2D(uTarget, vUv).xyz;
      gl_FragColor = vec4(base + splat, 1.0);
  }
`);

const advectionManualFilteringShader = compileShader(gl.FRAGMENT_SHADER, `
  precision highp float;
  precision mediump sampler2D;

  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (in sampler2D sam, in vec2 p) {
      vec4 st;
      st.xy = floor(p - 0.5) + 0.5;
      st.zw = st.xy + 1.0;
      vec4 uv = st * texelSize.xyxy;
      vec4 a = texture2D(sam, uv.xy);
      vec4 b = texture2D(sam, uv.zy);
      vec4 c = texture2D(sam, uv.xw);
      vec4 d = texture2D(sam, uv.zw);
      vec2 f = p - st.xy;
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main () {
      vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
      gl_FragColor = dissipation * bilerp(uSource, coord);
      gl_FragColor.a = 1.0;
  }
`);

const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
  precision highp float;
  precision mediump sampler2D;

  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;

  void main () {
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      gl_FragColor = dissipation * texture2D(uSource, coord);
      gl_FragColor.a = 1.0;
  }
`);