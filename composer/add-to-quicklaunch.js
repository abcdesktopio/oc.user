
// =================================
// You must defined launchers before running this js file
// like
// var launchers = "applications:geany.desktop,applications:firefox.desktop,applications:libreoffice-writer.desktop";
// =================================


function addLaunchersToQuicklaunch(widget) {
    widget.currentConfigGroup = ["General"];
    var currentLaunchers = widget.readConfig("launchers") || "";
     
    // needs to be called twice for the launchers to show up properly
    // but why? A bug?
    widget.writeConfig("launchers", launchers ); 
    // twice !
    widget.writeConfig("launchers", launchers);
    print("Launchers is updated.");
    widget.reloadConfig();
}


// find a panel
var panels = panelIds;
var quicklaunchFound = false;

for (var i = 0; i < panels.length; i++) {
    var panel = panelById(panels[i]);
    var widgets = panel.widgets();

    for (var j = 0; j < widgets.length; j++) {
        //print( "j=" + j + " -> " );
        print( widgets[j].type );
        print( "\n" ); 
        if (widgets[j].type === "org.kde.plasma.taskmanager") {
            print("Quicklaunch org.kde.plasma.taskmanager is found.");
            addLaunchersToQuicklaunch(widgets[j]);
            quicklaunchFound = true;
            break;
        }
    }
    if (quicklaunchFound) break;
}

