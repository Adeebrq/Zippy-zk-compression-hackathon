import styled from "styled-components";
import HeartIcon from "../assets/heartIcon.png"

const Footer = () => {
  return (
    <FooterBody>

      <About>
        <LogoBox>
        <LogoText>Zippy</LogoText>
        <PunchLine>The CPOP dApp</PunchLine>
        <Description>Zippy is a platform that enables creators to mint experience tokens (cTokens) for events, workshops, or any community engagement. These tokens can be seamlessly airdropped to participants via a simple and secure QR code scan mechanism.</Description>
        </LogoBox>
      </About>
      <div className="credit">
        <DevelopedBy>
        <p>Developed with ❤️ by <a href="https://github.com/Adeebrq" target="_blank" >Adeeb</a></p> 
        </DevelopedBy>
      </div>

    </FooterBody>
  )
}

const About= styled.div`
  width: 50%;
  padding-left: 10px;
`

const FooterBody= styled.div`
  border-top: 1px solid grey;
  display: flex;
  justify-content: space-between;
  position: relative;
`
const LogoBox = styled.data`
  padding: 10px;
  width: 50%;
`

const Description = styled.div`
  font-size: 14px;
  margin-top: 10px;
`

const LogoText = styled.p`
  color: ${(props) => props.theme.text};
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  font-family: "MyCustomFont";
`;

const PunchLine = styled.div`
  font-size: 8px;
`

const DevelopedBy = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px;
  position: absolute;
  bottom: -10px;
  right: 10px;
  a {
    color: #0077ff;         // Custom link color
    text-decoration: none;  // Remove underline
    font-weight: bold;      // Optional
    margin-left: 5px;       // Space between text and link
    transition: color 0.3s;

    &:hover {
      color: #0055aa;       // Hover effect
      text-decoration: underline; // Optional hover underline
    }
  }  
`


export default Footer