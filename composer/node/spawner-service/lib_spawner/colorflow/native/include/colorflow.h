#ifndef _COVERFLOW_H_
#define _COVERFLOW_H_

typedef struct{
    unsigned char red;
    unsigned char green;
    unsigned char blue;
    unsigned char alpha;
} pixel;

#define EXIT_FAILURE_OPEN_FAILED 1
#define EXIT_FAILURE_BAD_FILE 2
#define EXIT_FAILURE_USUPPORTED_FILE_FORMAT 3
#define EXIT_FAILURE_MALLOC 4
#define EXIT_FAILURE_BAD_PERCENTAGE 5
#define EXIT_FAILURE_UNKNOWN_OPTION 6
#define EXIT_FAILURE_NEEDS_ARGUMENT 7


int getColor(char* filename, pixel *myPixel);
char* pixelToHex(pixel* myPixel);

#endif