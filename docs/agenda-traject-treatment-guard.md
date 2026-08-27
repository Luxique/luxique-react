# Agenda guard: traject-dagen versus behandelingen

Bij het aanmaken van een boekbaar behandel-moment controleert de agenda de geladen
`blok_dagen` van open en volle traject-klassen. De server voert dezelfde controle
opnieuw uit voordat een Cal.com availability override wordt geschreven. Een
traject-dag blokkeert daarmee de volledige dag voor behandelingen.

## Bekend randgeval: behandeling bestaat vóór de klas

De omgekeerde volgorde wordt nog niet geblokkeerd. Als Chiva eerst een boekbaar
behandel-moment aanmaakt en daarna een traject-klas met dezelfde datum toevoegt,
controleert de klas-aanmaak de bestaande Cal.com treatment overrides momenteel
niet. De klas kan dan worden aangemaakt terwijl het eerdere behandel-moment blijft
bestaan.

Een vervolgbescherming hoort vóór het opslaan van een nieuwe of verplaatste klas de
beide treatment schedules op alle berekende `blok_dagen` te controleren. Bij een
conflict moet de klas-aanmaak waarschuwen en stoppen, met vermelding van datum,
behandeling en tijd. Deze controle valt bewust buiten de huidige wijziging.
