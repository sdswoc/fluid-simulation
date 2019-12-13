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
    
