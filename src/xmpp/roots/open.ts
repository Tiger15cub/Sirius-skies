import WebSocket from "ws";
import xmlbuilder from "xmlbuilder";

const ns = "urn:ietf:params:xml:ns:xmpp-framing";
const streamNs = "http://etherx.jabber.org/streams";
const rosterNs = "urn:xmpp:features:rosterver";
const tlsNs = "urn:ietf:params:xml:ns:xmpp-tls";
const bindNs = "urn:ietf:params:xml:ns:xmpp-bind";
const compressNs = "http://jabber.org/features/compress";
const sessionNs = "urn:ietf:params:xml:ns:xmpp-session";
const saslNs = "urn:ietf:params:xml:ns:xmpp-sasl";
const iqAuthNs = "http://jabber.org/features/iq-auth";
const domain = "prod.ol.epicgames.com";

export default async function open(
  socket: WebSocket,
  isAuthenticated: boolean,
  id: string
): Promise<void> {
  socket.send(
    xmlbuilder
      .create("open")
      .attribute("xmlns", ns)
      .attribute("from", domain)
      .attribute("id", id)
      .attribute("version", "1.0")
      .attribute("xml:lang", "en")
      .toString()
  );

  if (isAuthenticated) {
    socket.send(
      xmlbuilder
        .create("stream:features")
        .attribute("xmlns:stream", "http://etherx.jabber.org/streams")
        .element("ver")
        .attribute("xmlns", "urn:xmpp:features:rosterver")
        .up()
        .element("starttls")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-tls")
        .up()
        .element("bind")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-bind")
        .up()
        .element("compression")
        .attribute("xmlns", "http://jabber.org/features/compress")
        .element("method", "zlib")
        .up()
        .up()
        .element("session")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-session")
        .up()
        .toString({ pretty: true })
    );
  } else {
    socket.send(
      xmlbuilder
        .create("stream:features")
        .attribute("xmlns:stream", "http://etherx.jabber.org/streams")
        .element("mechanisms")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl")
        .element("mechanism", "PLAIN")
        .up()
        .up()
        .element("ver")
        .attribute("xmlns", "urn:xmpp:features:rosterver")
        .up()
        .element("starttls")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-tls")
        .up()
        .element("compression")
        .attribute("xmlns", "http://jabber.org/features/compress")
        .element("method", "zlib")
        .up()
        .up()
        .element("auth")
        .attribute("xmlns", "http://jabber.org/features/iq-auth")
        .up()
        .toString({ pretty: true })
    );
  }
}
