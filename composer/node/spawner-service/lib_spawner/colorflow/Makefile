libcolorflow: native/include/libnsbmp.c native/colorflow.c
	gcc -c -Wall -Werror -fpic native/include/libnsbmp.c
	ar -rs libbmp.a libnsbmp.o
	llvm-strip libbmp.a
	gcc -c -Wall -Werror -fpic native/colorflow.c
	ar -rs libcolorflow.a colorflow.o 
	llvm-strip libcolorflow.a

clean: libnsbmp.o colorflow.o
	rm libnsbmp.o
	rm colorflow.o