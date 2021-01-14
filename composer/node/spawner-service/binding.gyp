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
    }
  ]
}