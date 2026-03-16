// =================================
// You must defined hexacolor before running this js file
// like
// var image = "/home/fry/.wallpapers/Photo by SpaceX.jpg";
// =================================


var ca = currentActivity();
var desktopsArray = desktopsForActivity(currentActivity());
let desktop=desktopsArray[0];

// debug log
print( "desktop=" + desktop + "\n" );
print( "type=" + desktop.type + "\n" );
print( "id=" + desktop.id + "\n" );
print( "wallpaperPlugin=" +  desktop.wallpaperPlugin + "\n" );
print( "currentConfigGroup=" + desktop.currentConfigGroups + "\n" );
print( "configGroups=" + desktop.configGroups + "\n" );
print( "desktop.configGroups.length=" + desktop.configGroups.length + "\n" );
print( "configKeys=" + desktop.configKeys+ "\n" );
print( "desktop.configKeys.length=" + desktop.configKeys.length + "\n" );


// var rgbcolor=hex2rgb( hexacolor );
// var str_rgbcolor=rgbcolor.r + ',' + rgbcolor.g + ',' + rgbcolor.b;

// write color
desktop.wallpaperPlugin = "org.kde.image";
desktop.currentConfigGroup = Array("Wallpaper", "org.kde.image", "General");
desktop.writeConfig("Image", image);
desktop.reloadConfig();
