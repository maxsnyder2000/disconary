import {useCallback, useMemo, useState} from "react";
import {Button, Checkbox, Input, List, Popover, Table, Whisper} from "rsuite";
import "rsuite/dist/rsuite.min.css";
import "./App.css";

const {Cell, Column, HeaderCell} = Table;

const json = (promise) => {
  return promise.then((response) => response.json());
};

const getReleases = (artist) => {
  const url = "https://us-central1-disconary.cloudfunctions.net/getReleases?artist=" + encodeURIComponent(artist);
  return json(fetch(url));
};

const getRelease = (id) => {
  const url = "https://us-central1-disconary.cloudfunctions.net/getRelease?id=" + encodeURIComponent(id);
  return json(fetch(url));
};

const BR3 = () => {
  return (
    <>
      <br />
      <br />
      <br />
    </>
  );
};

const App = () => {
  const [artist, setArtist] = useState(null);
  const [artistInput, setArtistInput] = useState("");
  const [release, setRelease] = useState(null);
  const [releases, setReleases] = useState(null);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [showArtist, setShowArtist] = useState(true);
  const [showFeature, setShowFeature] = useState(false);

  const onSearch = useCallback(() => {
    if (artist === artistInput) {
      return;
    }

    setArtist(null);
    setRelease(null);
    setReleases(null);

    if (!artistInput.length) {
      return;
    }

    setReleasesLoading(true);
    getReleases(artistInput).then((releases) => {
      setArtist(artistInput);
      setReleases(releases);
    }).finally(() => {
      setReleasesLoading(false);
    });
  }, [artist, artistInput]);

  const data = useMemo(() => {
    return releases && releases
      .filter((a) => (showArtist && a.artist === artist) || (showFeature && a.artist !== artist))
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => a.artist.localeCompare(b.artist))
      .sort((a, b) => !(a.releaseDate) ? 1 : (!(b.releaseDate) ? -1 : a.releaseDate - b.releaseDate));
  }, [artist, releases, showArtist, showFeature]);

  const artistSpeaker = useMemo(() => (
    <Popover>
      <Checkbox checked={showArtist} onChange={(_, show) => setShowArtist(show)} /> {artist}
      <br />
      <Checkbox checked={showFeature} onChange={(_, show) => setShowFeature(show)} /> Featuring {artist}
    </Popover>
  ), [artist, showArtist, showFeature]);

  const rolesSpeaker = useMemo(() => (release && release.roles &&
    <Popover>
      <List>
        {release.roles.length
          ? release.roles.map((role) => (
              <List.Item key={role.name}><b>{role.name}</b>: {role.roles.join(", ")}</List.Item>
            ))
          : <List.Item>No data available.</List.Item>
        }
      </List>
    </Popover>
  ), [release]);

  const ImageCell = ({rowData, ...props}) => {
    return (
      <Cell {...props}>
        <img alt="" src={rowData.imgURL} width="75px" />
      </Cell>
    );
  };

  const RolesCell = ({rowData, ...props}) => {
    const [releaseLoading, setReleaseLoading] = useState(false);

    const onClick = useCallback(() => {
      setReleaseLoading(true);
      getRelease(rowData.id).then((roles) => {
        setRelease({id: rowData.id, roles: roles});
      }).finally(() => {
        setReleaseLoading(false);
      });
    }, [rowData]);

    const button = useMemo(() => (
      <Button appearance="subtle" loading={releaseLoading} onClick={onClick}>Load Roles</Button>
    ), [onClick, releaseLoading]);

    return (
      <Cell {...props}>
        {release && release.id === rowData.id
          ? <Whisper placement="top" speaker={rolesSpeaker} trigger="hover">
              {button}
            </Whisper>
          : button
        }
      </Cell>
    );
  };

  return (
    <div align="center" className="App">
      <BR3 />
      <img alt="" src="https://fontmeme.com/permalink/220907/8e8fc1800913e43f2d53ea22dcdeaa27.png" />
      <BR3 />
      <Input onChange={setArtistInput} placeholder="Artist Name" value={artistInput} style={{width: "20vw"}} />
      <br />
      <Button loading={releasesLoading} onClick={onSearch} style={{width: "20vw"}}>
        Search <b>Disco</b>graphy
      </Button>
      <BR3 />
      {artist &&
        <Table autoHeight data={data} headerHeight={100} onRowClick={(rowData) => setArtistInput(rowData.artist)} rowHeight={100} style={{width: "90vw"}}>
          <Column flexGrow={1} verticalAlign="middle">
            <HeaderCell>Album Art</HeaderCell>
            <ImageCell />
          </Column>
          <Column flexGrow={1} verticalAlign="middle">
            <HeaderCell>
              <Whisper placement="bottom" speaker={artistSpeaker} trigger="click">
                <Button appearance="subtle">Artist</Button>
              </Whisper>
            </HeaderCell>
            <Cell dataKey="artist" />
          </Column>
          <Column flexGrow={1} verticalAlign="middle">
            <HeaderCell>Name</HeaderCell>
            <Cell dataKey="name" />
          </Column>
          <Column flexGrow={1} verticalAlign="middle">
            <HeaderCell>Release Date</HeaderCell>
            <Cell dataKey="releaseDate" />
          </Column>
          <Column flexGrow={1} verticalAlign="middle">
            <HeaderCell>Roles</HeaderCell>
            <RolesCell />
          </Column>
        </Table>
      }
    </div>
  );
};

export default App;
