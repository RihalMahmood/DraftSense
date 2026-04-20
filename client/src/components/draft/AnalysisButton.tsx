import React from 'react';
import styled from 'styled-components';

interface AnalysisButtonProps {
  onClick: () => void;
}

export const AnalysisButton: React.FC<AnalysisButtonProps> = ({ onClick }) => {
  return (
    <StyledWrapper>
      <button className="Btn" onClick={onClick}>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .Btn {
    width: 240px;
    height: 50px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(to right,#77530a,#ffd277,#77530a,#77530a,#ffd277,#77530a);
    background-size: 250%;
    background-position: left;
    color: #ffd277;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition-duration: 1s;
    overflow: hidden;
    font-family: 'Cinzel', serif;
    font-weight: bold;
    letter-spacing: 0.1em;
  }

  .Btn::before {
    position: absolute;
    content: "INITIALIZE ANALYSIS";
    color: #ffd277;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 98%;
    height: 90%;
    border-radius: 8px;
    transition-duration: 1s;
    background-color: rgba(0, 0, 0, 0.9);
    background-size: 200%;
  }

  .Btn:hover {
    background-position: right;
    transition-duration: 1s;
  }

  .Btn:hover::before {
    background-position: right;
    transition-duration: 1s;
    background-color: rgba(0, 0, 0, 0.7);
  }

  .Btn:active {
    transform: scale(0.95);
  }`;
