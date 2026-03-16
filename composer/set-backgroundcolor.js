// =================================
// You must defined hexacolor before running this js file
// like
// var hexacolor = "#CAFE75";
// =================================

var ca = currentActivity();
var desktopsArray = desktopsForActivity(currentActivity());
let desktop=desktopsArray[0];

const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // return {r, g, b}
    return { r, g, b };
}


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

// write color
desktop.wallpaperPlugin = "org.kde.color";
desktop.currentConfigGroup = Array("Wallpaper", "org.kde.color", "General");

var rgbcolor=hex2rgb( hexacolor );
var str_rgbcolor=rgbcolor.r + ',' + rgbcolor.g + ',' + rgbcolor.b;
print( "converted color is " + str_rgbcolor + '\n');
let previouscolor = desktop.readConfig("Color");
print( "previous color is " + previouscolor + '\n' );
desktop.writeConfig("Color", str_rgbcolor);
desktop.writeConfig("Color", str_rgbcolor); // twice
desktopsArray[0].reloadConfig();
let newcolor = desktop.readConfig("Color");
print( "new color is " + newcolor + '\n');
print( "again\n");
desktop.writeConfig("Color", str_rgbcolor);
desktop.reloadConfig();
