#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>
#include <assert.h>
#include <sys/stat.h>
#include <Imlib2.h>
#include "include/colorflow.h"



// Initialization global varibales
int width, height;
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

  // // Establishing average color of the right border
  // int right_border_average_color[4] = {0,0,0,0};
  // getAverageBorderColor(pixels_image, right_border_average_color, 0, height, (int)(width*(1-frame_percentage)), width);

  // // Establishing average color of the left border
  // int down_border_average_color[4] = {0,0,0,0};
  // getAverageBorderColor(pixels_image, down_border_average_color, (int)((1-frame_percentage)*height), height, 0, width);

  // // Establishing average color of the lower border
  // int left_border_average_color[4] = {0,0,0,0};
  // getAverageBorderColor(pixels_image, left_border_average_color, 0, height, 0, (int)(width*frame_percentage));

  // Establishing the average color of the frame
  static int average_RGBA[4];
  for(int i=0;i<4;i++){
    average_RGBA[i] = up_border_average_color[i];
  }
  
  return average_RGBA;
}


/// @brief opens a picture and store the RGBA values of each pixel in a matrix
/// @param image picture we want to get the color of each pixel
/// @return matrix of pixels returned by function called 
pixel** read_data(Imlib_Image image){

  // getting the image data
  imlib_context_set_image(image);
  unsigned int* data = imlib_image_get_data_for_reading_only();
  if(!data){
    // free image ressources
    imlib_free_image();
    fprintf(stderr,"Error while reading data\n");
    exit(EXIT_FAILURE_OPEN_FAILED);
  }

  // getting width and height values of the image
  width = imlib_image_get_width();
  height = imlib_image_get_height();

  pixel** pixels_image = (pixel**)malloc(height*sizeof(pixel*) + height*width*sizeof(pixel));
  if(!pixels_image){
    // free image ressources
    imlib_free_image();
    fprintf(stderr,"Error while allowing memory.\n");
    exit(EXIT_FAILURE_MALLOC);
  }

  for(int y = 0; y < height; y++) {
    pixels_image[y] = (pixel*)(pixels_image + height) + width * y;
    for(int x = 0; x < width; x++) {
      // getting the color of each pixel and storing it RGBA values inside the matrix of pixels
      Imlib_Color color;
      imlib_image_query_pixel(x, y, &color);
      pixels_image[y][x] = createPixel(color.red,color.green,color.blue,color.alpha);
    }
  }

  // free image ressources
  imlib_free_image();

  return pixels_image;
}

/// @brief get the average color of an image
/// @param filename name of the image file we want the average color
/// @param myPixel pixel the program wil store the RGBA values into
/// @return 0 if everything is fine, 1 otherwise
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

  Imlib_Image image = imlib_load_image(filename);
  if(!image){
    fprintf(stderr,"Error while loading image %s\n", filename);
    perror("open");
    exit(EXIT_FAILURE_OPEN_FAILED);
  } 

  pixel** pixels_image = read_data(image);

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

/// @brief converts a pixel to its hexadecimal representation
/// @param myPixel a pointer to a pixel structure containing red, green, and blue components
/// @return hexadecimal representation ot myPixel (e.g., "#RRGGBB")
char* pixelToHex(pixel* myPixel){
  static char average_HEX[8];
  int sizeCreatedStr = sprintf(average_HEX, "#%02X%02X%02X", myPixel->red, myPixel->green, myPixel->blue);
  if(sizeCreatedStr != 7){
    strLastErrorMessage = (char*)"Error while getting HEX values.";
    return NULL;
  }
  return average_HEX;
}