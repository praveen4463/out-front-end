import React, {useState} from 'react';
import SplitPane from 'react-split-pane';
import LeftNavigation from './LeftNavigation';
import BottomNavigation from './BottomNavigation';
import RightNavigation from './RightNavigation';
import Editor from './Editor';
import RightPane from './RightPane';
import BottomPane from './BottomPane';
import LeftPane from './LeftPane';
import {LeftNavs, None} from './Constants';
import '../react-split-pane.css';

const navClick = (setSelectedState, activeIconState, setActiveIconState) => {
  return (nav) => {
    if (activeIconState === nav) {
      setActiveIconState(None);
      return;
    }
    setSelectedState(nav);
    setActiveIconState(nav);
  };
};

const closePane = (activeIconState, setActiveIconState) => {
  return () => {
    if (activeIconState !== None) {
      setActiveIconState(None);
    }
  };
};

const Content = () => {
  // Default nav state on mount are specified, but in future this may come from
  // props, for example loading state from storage on page refresh/load.

  const [leftNavSelected, setLeftNavSelected] = useState(LeftNavs.EXPLORER);
  const [leftNavActiveIcon, setLeftNavActiveIcon] = useState(LeftNavs.EXPLORER);

  const [rightNavSelected, setRightNavSelected] = useState(None);
  const [rightNavActiveIcon, setRightNavActiveIcon] = useState(None);

  const [bottomNavSelected, setBottomNavSelected] = useState(None);
  const [bottomNavActiveIcon, setBottomNavActiveIcon] = useState(None);

  return (
    <div
      style={{
        display: 'flex',
        flex: '1 1 auto',
        height: '100%',
        width: 'initial',
      }}>
      <LeftNavigation
        clickHandler={navClick(
          setLeftNavSelected,
          leftNavActiveIcon,
          setLeftNavActiveIcon
        )}
        active={leftNavActiveIcon}
      />
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: 48,
          right: 22,
          bottom: 22,
          height: 'auto',
        }}>
        <SplitPane
          split="horizontal"
          primary="second"
          defaultSize="20%"
          minSize={0}
          onChange={(size) => {
            if (size === 0 && bottomNavActiveIcon !== None) {
              setBottomNavActiveIcon(None);
            } else if (size > 0 && bottomNavActiveIcon === None) {
              setBottomNavActiveIcon(bottomNavSelected);
            }
          }}
          pane1Style={{
            maxHeight: '100%',
          }}
          pane2Style={{
            visibility: bottomNavActiveIcon === None ? 'hidden' : 'visible',
            maxHeight: bottomNavActiveIcon === None ? 0 : '50%',
            minHeight: bottomNavActiveIcon === None ? 0 : '15%',
          }}>
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}>
            <SplitPane
              split="vertical"
              defaultSize="30%"
              minSize={0}
              onChange={(size) => {
                if (size === 0 && leftNavActiveIcon !== None) {
                  setLeftNavActiveIcon(None);
                } else if (size > 0 && leftNavActiveIcon === None) {
                  setLeftNavActiveIcon(leftNavSelected);
                }
              }}
              pane1Style={{
                visibility: leftNavActiveIcon === None ? 'hidden' : 'visible',
                maxWidth: leftNavActiveIcon === None ? 0 : '50%',
                minWidth: leftNavActiveIcon === None ? 0 : '15%',
              }}
              pane2Style={{
                height: '100%',
              }}>
              {leftNavActiveIcon === None ? (
                <div />
              ) : (
                <LeftPane
                  closeHandler={closePane(
                    leftNavActiveIcon,
                    setLeftNavActiveIcon
                  )}
                  selected={leftNavSelected}
                />
              )}
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                <SplitPane
                  split="vertical"
                  primary="second"
                  defaultSize="30%"
                  minSize={0}
                  onChange={(size) => {
                    if (size === 0 && rightNavActiveIcon !== None) {
                      setRightNavActiveIcon(None);
                    } else if (size > 0 && rightNavActiveIcon === None) {
                      setRightNavActiveIcon(rightNavSelected);
                    }
                  }}
                  pane1Style={{
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                  pane2Style={{
                    visibility:
                      rightNavActiveIcon === None ? 'hidden' : 'visible',
                    maxWidth: rightNavActiveIcon === None ? 0 : '100%',
                    minWidth: rightNavActiveIcon === None ? 0 : '25%',
                  }}>
                  <Editor />
                  {rightNavActiveIcon === None ? (
                    <div />
                  ) : (
                    <RightPane
                      closeHandler={closePane(
                        rightNavActiveIcon,
                        setRightNavActiveIcon
                      )}
                      selected={rightNavSelected}
                    />
                  )}
                </SplitPane>
              </div>
            </SplitPane>
          </div>
          {bottomNavActiveIcon === None ? (
            <div />
          ) : (
            <BottomPane
              closeHandler={closePane(
                bottomNavActiveIcon,
                setBottomNavActiveIcon
              )}
              selected={bottomNavSelected}
            />
          )}
        </SplitPane>
      </div>
      <RightNavigation
        clickHandler={navClick(
          setRightNavSelected,
          rightNavActiveIcon,
          setRightNavActiveIcon
        )}
        active={rightNavActiveIcon}
      />
      <BottomNavigation
        clickHandler={navClick(
          setBottomNavSelected,
          bottomNavActiveIcon,
          setBottomNavActiveIcon
        )}
        active={bottomNavActiveIcon}
      />
    </div>
  );
};

export default Content;
