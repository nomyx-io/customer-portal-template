// THIS IS CURRENTLY BEING EXECUTED CLIENT SIDE
import Parse from 'parse';

const initializeParse = () => {
  Parse.initialize(
    process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID || 'lenderLabDev',
    process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY
  );
  Parse.serverURL = `${process.env.NEXT_PUBLIC_PARSE_SERVER_URL}/parse` || '';
};

export default initializeParse;
