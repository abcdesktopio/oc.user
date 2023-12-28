#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>
#include <assert.h>
#include <sys/stat.h>
#include "include/png.h"
#include "include/jpeglib.h"
#include "include/libnsbmp.h"
#include "include/colorflow.h"


// Initialization global varibales
int width, height;
size_t size;
char* strLastErrorMessage;

/// @param R Red component
/// @param G Green component
/// @param B Blue component
/// @param A Alpha component
/// @return new created pixel with the specified RGBA values
pixel createPixel(unsigned char R, unsigned char G, unsigned char B, unsigned char A){
  pixel p;
  p.red = R;
  p.green = G;
  p.blue = B;
  p.alpha = A;
  return p;
}

/// @brief read a png file and store the RGBA values of each pixel in a matrix
/// @param file binary file of a png picture
/// @return matrix of pixels that contains the RGBA values of each pixel
/// @author code from https://gist.github.com/niw/5963798
pixel** read_png_file(FILE *file) {
  png_byte color_type;
  png_byte bit_depth;
  png_bytep *row_pointers = NULL;

  png_structp png = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
  if(!png) return NULL;

  png_infop info = png_create_info_struct(png);
  if(!info) return NULL;

  if(setjmp(png_jmpbuf(png))) return NULL;

  png_init_io(png, file);

  png_read_info(png, info);

  width      = png_get_image_width(png, info);
  height     = png_get_image_height(png, info);
  color_type = png_get_color_type(png, info);
  bit_depth  = png_get_bit_depth(png, info);

  // Read any color_type into 8bit depth, RGBA format.
  // See http://www.libpng.org/pub/png/libpng-manual.txt

  if(bit_depth == 16)
    png_set_strip_16(png);

  if(color_type == PNG_COLOR_TYPE_PALETTE)
    png_set_palette_to_rgb(png);

  // PNG_COLOR_TYPE_GRAY_ALPHA is always 8 or 16bit depth.
  if(color_type == PNG_COLOR_TYPE_GRAY && bit_depth < 8)
    png_set_expand_gray_1_2_4_to_8(png);

  if(png_get_valid(png, info, PNG_INFO_tRNS))
    png_set_tRNS_to_alpha(png);

  // These color_type don't have an alpha channel then fill it with 0xff.
  if(color_type == PNG_COLOR_TYPE_RGB ||
     color_type == PNG_COLOR_TYPE_GRAY ||
     color_type == PNG_COLOR_TYPE_PALETTE)
    png_set_filler(png, 0xFF, PNG_FILLER_AFTER);

  if(color_type == PNG_COLOR_TYPE_GRAY ||
     color_type == PNG_COLOR_TYPE_GRAY_ALPHA)
    png_set_gray_to_rgb(png);

  png_read_update_info(png, info);

  if (row_pointers) return NULL;

  row_pointers = (png_bytep*)malloc(sizeof(png_bytep) * height);
  for(int y = 0; y < height; y++) {
    row_pointers[y] = (png_byte*)malloc(png_get_rowbytes(png,info));
  }

  png_read_image(png, row_pointers);

  // Allowing the memory for the matrix of pixels
  pixel** pixels = (pixel**)malloc(height*sizeof(pixel*) + height*width*sizeof(pixel));
  if(!pixels){
        strLastErrorMessage = (char*)"Error while allowing memory for pixel matrix.";
        return NULL;
  }

  for(int y = 0; y < height; y++) {
    pixels[y] = (pixel*)(pixels + height) + width * y;
    png_bytep row = row_pointers[y];
    for(int x = 0; x < width; x++) {
      png_bytep px = &(row[x * 4]);
      pixels[y][x] = createPixel(px[0],px[1],px[2],px[3]);
    }
  }

  // Free ressources
  png_destroy_read_struct(&png, &info, NULL);

  return pixels;
}

/// @brief read a jpeg file and store the RGBA values of each pixel in a matrix
/// @param file binary file of a jpeg picture
/// @return matrix of pixels that contains the RGBA values of each pixel
/// @author code inspired by this code https://github.com/LuaDist/libjpeg/blob/master/example.c
pixel** read_jpg_file(FILE *file){

  // Structure for JPEG picture
  struct jpeg_decompress_struct cinfo;
  struct jpeg_error_mgr jerr;

  cinfo.err = jpeg_std_error(&jerr);
  jpeg_create_decompress(&cinfo);

  // Link with JPEG file
  jpeg_stdio_src(&cinfo, file);

  // Reading headers
  (void) jpeg_read_header(&cinfo, TRUE);

  // Start decompress
  (void) jpeg_start_decompress(&cinfo);

  // Reading pictures informations
  width = cinfo.output_width;
  height = cinfo.output_height;
  int numComponents = cinfo.output_components;
  int row_stride = width * numComponents;

  // Allow memory to be able to read 1 line of the picture
  JSAMPARRAY buffer = (*cinfo.mem->alloc_sarray)((j_common_ptr) &cinfo, JPOOL_IMAGE, row_stride, 1);

  // Allowing the memory for the matrix of pixels
  pixel** pixels = (pixel**)malloc(height*sizeof(pixel*) + height*width*sizeof(pixel));
  if(!pixels){
        strLastErrorMessage = (char*)"Error while allowing memory for pixel matrix.";
        return NULL;
  }


  for(int y=0; y<height;y++){
    (void) jpeg_read_scanlines(&cinfo, buffer, 1);
    pixels[y] = (pixel*)(pixels + height) + width * y;
    for (int x = 0; x < width; x++) {
      pixels[y][x] = createPixel(buffer[0][x * numComponents],buffer[0][x * numComponents + 1],buffer[0][x * numComponents + 2],(cinfo.output_components == 4) ? buffer[0][x * numComponents + 2] : 255);
    }
  }

  // Finish decompress
  (void) jpeg_finish_decompress(&cinfo);

  // Free ressources
  jpeg_destroy_decompress(&cinfo);

  return pixels;
}

/******************************************************************************************************************************************************************************
 *                                                                                                                                                                            *
 *                 Reading BMP files, all the following part is inspired by example code of libnsbmp http://source.netsurf-browser.org/libnsbmp.git/                          *
 *                                                                                                                                                                            *
*******************************************************************************************************************************************************************************/

#define BYTES_PER_PIXEL 4
#define MAX_IMAGE_BYTES (48 * 1024 * 1024)

static void *bitmap_create(int width, int height, unsigned int state)
{
        (void) state;  /* unused */
        /* ensure a stupidly large (>50Megs or so) bitmap is not created */
        if (((long long)width * (long long)height) > (MAX_IMAGE_BYTES/BYTES_PER_PIXEL)) {
                return NULL;
        }
        return calloc(width * height, BYTES_PER_PIXEL);
}


static unsigned char *bitmap_get_buffer(void *bitmap)
{
        assert(bitmap);
        return (unsigned char*)bitmap;
}


static size_t bitmap_get_bpp(void *bitmap)
{
        (void) bitmap;  /* unused */
        return BYTES_PER_PIXEL;
}


static void bitmap_destroy(void *bitmap)
{
        assert(bitmap);
        free(bitmap);
}

static unsigned char *load_file(FILE *fd, size_t *data_size)
{
        unsigned char *buffer;
        size_t n;

        buffer = (unsigned char*)malloc(size);
        if (!buffer) {
          strLastErrorMessage = (char*)"Error while allowing memory.";
          return NULL;
        }

        n = fread(buffer, 1, size, fd);
        if (n != size) {
          return NULL;
        }

        *data_size = size;
        return buffer;
}

/// @brief read a bmp file and store the RGBA values of each pixel in a matrix
/// @param file binary file of a bmp picture
/// @return matrix of pixels that contains the RGBA values of each pixel
/// @authors code inspired by http://source.netsurf-browser.org/libnsbmp.git/
pixel** read_bmp_file(FILE *file){
  bmp_bitmap_callback_vt bitmap_callbacks = {
    bitmap_create,
    bitmap_destroy,
    bitmap_get_buffer,
    bitmap_get_bpp
  };
  bmp_result code;
  bmp_image bmp;
  size_t data_size;
  uint8_t *image;
  pixel** pixels = NULL;

  /* create our bmp image */
  bmp_create(&bmp, &bitmap_callbacks);

  /* load file into memory */
  unsigned char *data = load_file(file, &data_size);
  if(!data){
    return NULL;
  }

  /* analyse the BMP */
  code = bmp_analyse(&bmp, size, data);
  if (code != BMP_OK) {
    goto cleanup;
  }

  /* decode the image */
  code = bmp_decode(&bmp);
  if (code != BMP_OK) {
    goto cleanup;
  }  

  height = bmp.height;
  width = bmp.width;

  // Allowing the memory for the matrix of pixels
  pixels = (pixel**)malloc(height*sizeof(pixel*) + height*width*sizeof(pixel));
  if(!pixels){
        strLastErrorMessage = (char*)"Error while allowing memory for pixel matrix.";
        return NULL;
  }

  image = (uint8_t *) bmp.bitmap;
  for (int y = 0; y < height; y++) {
    pixels[y] = (pixel*)(pixels + height) + width * y;
    for (int x = 0; x < width; x++) {
      size_t z = (y * width + x) * BYTES_PER_PIXEL;
      pixels[y][x] = createPixel(image[z],image[z + 1],image[z + 2],255);
    }
  }

  cleanup:
    /* clean up */
    bmp_finalise(&bmp);
    free(data);

  return pixels;
}

/// @brief Return the average color of of a certain rectangular area of an image determined by start_row, end_row, start_column, end_column
/// @param pixels_image matrix of pixels
/// @param border_average_color array we want to store the average RGBA color into
/// @param start_row specifies on which row the area starts
/// @param end_row specifies on which row the area ends
/// @param start_column specifies on which column the area starts
/// @param end_column specifies on which column the area ends
void getAverageBorderColor(pixel** pixels_image, int *border_average_color, int start_row, int end_row, int start_column, int end_column){
  // establishing average color of the selected border
  int pixel_amount = ((end_row-start_row)*(end_column-start_column));

  // Measure to avoid division by 0
  if(pixel_amount == 0){
    pixel_amount = 1; 
  }

  // Summing the values of each pixel
  for(int y=start_row; y<end_row; y++){
    for(int x=start_column; x<end_column; x++){
      border_average_color[0] += (int)pixels_image[y][x].red;
      border_average_color[1] += (int)pixels_image[y][x].green;
      border_average_color[2] += (int)pixels_image[y][x].blue;
      border_average_color[3] += (int)pixels_image[y][x].alpha;
    }
  }

  // Dividing each component by the number of pixels
  for(int i=0;i<4;i++){
    border_average_color[i] /= pixel_amount;
  }
}

/// @brief determine the RGBA average color of the specified border
/// @param pixels_image matrix of pixels
/// @param frame_percentage percentage of the border to calculate the average RGBA
/// @return array that contains the average RGBA values
int* getAverageColor(pixel** pixels_image, double frame_percentage){

  // Establishing average color of the upper border
  int up_border_average_color[4] = {0,0,0,0};
  getAverageBorderColor(pixels_image, up_border_average_color, 0, (int)(height*frame_percentage), 0, width);

  // Establishing average color of the right border
  int right_border_average_color[4] = {0,0,0,0};
  getAverageBorderColor(pixels_image, right_border_average_color, 0, height, (int)(width*(1-frame_percentage)), width);

  // Establishing average color of the left border
  int down_border_average_color[4] = {0,0,0,0};
  getAverageBorderColor(pixels_image, down_border_average_color, (int)((1-frame_percentage)*height), height, 0, width);

  // Establishing average color of the lower border
  int left_border_average_color[4] = {0,0,0,0};
  getAverageBorderColor(pixels_image, left_border_average_color, 0, height, 0, (int)(width*frame_percentage));

  // Establishing the average color of the frame
  static int average_RGBA[4];
  for(int i=0;i<4;i++){
    average_RGBA[i] = up_border_average_color[i]+right_border_average_color[i]+down_border_average_color[i]+left_border_average_color[i];
    average_RGBA[i] /= 4;
  }
  
  return average_RGBA;
}


/// @brief opens an picture and call the right function depends on its format
/// @param file binary file of the picture to open-
/// @param buffer first characters of the binary file that contains the signature of the format
/// @return matrix of pixels returned by function called 
pixel** read_data(FILE *file, unsigned char* buffer){
  pixel** pixels_image;
  // Compare with png signature
  if (png_sig_cmp(buffer, 0, sizeof(buffer)) == 0) {
    pixels_image = read_png_file(file);
  } // Compare with jpg signature
  else if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF) {
    pixels_image = read_jpg_file(file);
  } 
  else if (buffer[0] == 'B' && buffer[1] == 'M') {
    pixels_image = read_bmp_file(file);
  } 
  else {
    strLastErrorMessage = (char*)"Unsupported file format.";
    return NULL;
  }
  return pixels_image;
}

int getColor(char* filename, pixel *myPixel) {
  struct stat sb;
  FILE *file = fopen(filename, "rb");
  if(!file){
    strLastErrorMessage = strerror(errno);
    return 1;
  } 

  if (stat(filename, &sb)) {
    strLastErrorMessage = strerror(errno);
    return 1;
  }

  size = sb.st_size;

  // Reading the first bytes of the binary file and store it in an array 
  unsigned char buffer[8];
  int read_len = fread(buffer, 1, sizeof(buffer), file);
  if(read_len != 8){
    fclose(file);
    strLastErrorMessage = (char*)"Error while reading file.";
    return 1;
  }

  // Reseting the pointer at the begining of the file
  int seek = fseek(file,0,SEEK_SET);
  if(seek){
    fclose(file);
    strLastErrorMessage = strerror(errno);
    return 1;
  }
  
  
  pixel** pixels_image = read_data(file, buffer);

  fclose(file);

  if(!pixels_image){
    return 1;
  }

  int* average_RGBA = getAverageColor(pixels_image, 0.1);
  myPixel->red = average_RGBA[0];
  myPixel->green = average_RGBA[1];
  myPixel->blue = average_RGBA[2];
  myPixel->alpha = average_RGBA[3];

  // Free ressources 
  free(pixels_image);

  return 0;
}

char* pixelToHex(pixel* myPixel){
  static char average_HEX[8];
  int sizeCreatedStr = sprintf(average_HEX, "#%02X%02X%02X", myPixel->red, myPixel->green, myPixel->blue);
  if(sizeCreatedStr != 7){
    strLastErrorMessage = (char*)"Error while getting HEX values.";
    return NULL;
  }
  return average_HEX;
}