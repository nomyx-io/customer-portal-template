const Regex = {
  alphaNumeric: /^[a-zA-Z0-9]+$/,
  alphaNumericAndSpace: /^[a-zA-Z0-9 ]+$/,
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
  numericWithDecimal: /^\d+(\.\d{1,18})?$/,
  numeric: /^[0-9]+$/,
  maxChar: (char: number) => new RegExp(`^.{1,${char}}$`),
  maxCharWithDecimal: (char: number, dec: number) => new RegExp(`^\\d{1,${char}}(\\.\\d{1,${dec}})?$`),
};

const isAlphanumeric = (input: string) => {
  return Regex.alphaNumeric.test(input);
};

const isAlphanumericAndSpace = (input: string) => {
  return Regex.alphaNumericAndSpace.test(input);
};

const isEthereumAddress = (address: string) => {
  return Regex.ethereumAddress.test(address);
};

const isNumeric = (input: string) => {
  return Regex.numeric.test(input);
};

const maxChar = (input: string, char: number) => {
  const regex = new RegExp(`^.{1,${char}}$`);
  return regex.test(input);
};

const generateRandomString = (length: number) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
};

export { isNumeric, maxChar, isAlphanumeric, isAlphanumericAndSpace, isEthereumAddress, generateRandomString, Regex };
