{
  "targets":[
    {
      "target_name":"spawnernative",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "./native/main.cpp"
      ],
      "libraries": [
          "-lX11",
          "-lXmu"
      ]
    },
    {
      "target_name": "colorflow",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
          "lib_spawner/colorflow/native/libcolorflow.cpp",
          "lib_spawner/colorflow/native/colorflow.cpp"
      ],
      "include_dirs": [
          "lib_spawner/colorflow/native/include"
      ],
      "libraries": [
          "-lImlib2"
      ]
    }
  ]
}